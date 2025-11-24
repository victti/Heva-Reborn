const wd = require("windivert");

export default class WinDivertProxy
{
    #handle: any;
    #filter: string;
    #headerReader: any;
    #originalDst: string = '218.232.226.6';
    #localServerIp: string = '127.0.0.1';
    #port: number = 80;

    constructor(
        originalDst: string = '211.43.155.20',
        port: number = 7001,
        localServerIp: string = '192.168.1.7'  // Use actual IP, not 127.0.0.1
    )
    {
        this.#originalDst = originalDst;
        this.#port = port;
        this.#localServerIp = localServerIp;
        
        // Capture both directions
        this.#filter = `(ip.DstAddr == ${originalDst} or ip.SrcAddr == ${originalDst}) and tcp.DstPort == ${port} or tcp.SrcPort == ${port}`;
        
        this.#headerReader = new wd.HeaderReader();
    }

    async start()
    {
        try {
            this.#handle = await wd.createWindivert(
                this.#filter, 
                wd.LAYERS.NETWORK, 
                wd.FLAGS.DEFAULT
            );

            this.#handle.open();
            console.log("[WinDivert] Proxy started");
            console.log(`[WinDivert] Redirecting ${this.#originalDst}:${this.#port} -> ${this.#localServerIp}:${this.#port}`);
            console.log("[WinDivert] Filter:", this.#filter);

            wd.addReceiveListener(this.#handle, (packet: any, addr: any) => {
                this.#handlePacket(packet, addr);
            });
        } catch (error) {
            console.error("Failed to start WinDivert:", error);
            throw error;
        }
    }

    #ipToBytes(ip: string): number[] {
        return ip.split('.').map(part => parseInt(part, 10));
    }

    #readIpFromBuffer(buffer: any, offset: number): string {
        return `${buffer[offset]}.${buffer[offset+1]}.${buffer[offset+2]}.${buffer[offset+3]}`;
    }

    #handlePacket(packetBuffer: any, addrBuffer: any)
    {
        try {
            this.#headerReader.setPacketBuffer(packetBuffer);
            this.#headerReader.setAddressBuffer(addrBuffer);
            
            const packetInfo = this.#headerReader.WinDivertHelperParsePacket();
            const addrInfo = this.#headerReader.readAddressData();
            
            if (packetInfo.IpHeader && ((packetBuffer[0] >> 4) & 0x0F) === 4) {
                const protocol = packetBuffer[9];
                
                // Only process TCP
                if (protocol !== 6) {
                    this.#handle.send({ packet: packetBuffer, addr: addrBuffer });
                    return false;
                }
                
                const srcIp = this.#readIpFromBuffer(packetBuffer, 12);
                const dstIp = this.#readIpFromBuffer(packetBuffer, 16);
                
                let modified = false;
                
                // Outbound: Client -> Remote Server, change to localhost
                if (dstIp === this.#originalDst) {
                    //console.log(`[WinDivert][OUT] ${srcIp} -> ${dstIp} | Redirecting to ${this.#localServerIp}`);
                    
                    const newIpBytes = this.#ipToBytes(this.#localServerIp);
                    packetBuffer[16] = newIpBytes[0];
                    packetBuffer[17] = newIpBytes[1];
                    packetBuffer[18] = newIpBytes[2];
                    packetBuffer[19] = newIpBytes[3];
                    
                    modified = true;
                }
                // Inbound: Localhost -> Client, masquerade as remote server
                else if (srcIp === this.#localServerIp) {
                    //console.log(`[WinDivert][IN]  ${srcIp} -> ${dstIp} | Masquerading as ${this.#originalDst}`);
                    
                    const newIpBytes = this.#ipToBytes(this.#originalDst);
                    packetBuffer[12] = newIpBytes[0];
                    packetBuffer[13] = newIpBytes[1];
                    packetBuffer[14] = newIpBytes[2];
                    packetBuffer[15] = newIpBytes[3];
                    
                    modified = true;
                }
                
                if (modified) {
                    // Recalculate checksums
                    addrInfo.setIPChecksum(0);
                    addrInfo.setTCPChecksum(0);
                    
                    const helper = this.#handle.HelperCalcChecksums({ packet: packetBuffer }, 0);
                    
                    if (helper.IPChecksum === 0 || helper.TCPChecksum === 0) {
                        console.error("[WinDivert] Checksum calculation failed");
                        return false;
                    }
                    
                    addrInfo.setIPChecksum(helper.IPChecksum);
                    addrInfo.setTCPChecksum(helper.TCPChecksum);
                }
                
                // Send packet
                this.#handle.send({ packet: packetBuffer, addr: addrBuffer });
            }
            
            return false;
            
        } catch (error) {
            console.error("[WinDivert] Packet handling error:", error);
            return false;
        }
    }

    stop()
    {
        if (this.#handle) {
            this.#handle.close();
            this.#handle = null;
            console.log("WinDivert proxy stopped");
        }
    }
}