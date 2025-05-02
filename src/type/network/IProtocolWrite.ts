import HevaProtocolWriter from "../../network/hevaProtocolWriter";

export default interface IProtocolWrite
{
	write(w: HevaProtocolWriter): void;
}