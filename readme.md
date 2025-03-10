<h3 align="center">Heva Reborn</h3>

<div align="center">

![HR typescript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![HR mongodb](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)

</div>

## Repo <a name = "information"></a>

I'm sharing this with the purpose of trying to get attention of people who are still interested on this game. If you know something that can help, feel free to contribute or reach out to me.

> [!IMPORTANT]
> If you need to report anything about this repo, or otherwise reach out to me, you can find me at victti.silva@gmail.com.

## About <a name = "about"></a>

Heva Reborn is an attempt to create a server emulator of a Masssive Multiplayer Online game shutdown on 2016 known as Heva Clonia Online, it was developed by WindSoft and Playbuster. There is no information about the game development available on the internet but researching the game files this is what I could find:

- PlayBuster was main developer of the game, since most files uses a format made by them (.pbz for compression, .pbm for models, .pba for animations etc).
- The game is made using the [Irrlicht Engine](https://irrlicht.sourceforge.io/), an open source C++ game engine.
   - They also used an open source plugin called [My3DTools](https://web.archive.org/web/20090426043101/http://my3dproject.nm.ru/). The plugin was added as a feature to the engine a few years after it was made. They probably used the version that was shipped with the engine and actually updated it since version header doesn't match the latest public release.

The game was then republished on different regions by [OGPlanet](https://en.wikipedia.org/wiki/OGPlanet) (US), [QEON](https://www.qeon.com) (IDN), PMANG (JPN). It stopped receiving major updates on 2013 and around 2015 it was shutdown on all regions. Due to the lack of information about Playbuster, the company was probably small and shutdown, leaving the publishers without new updates which was probably the reason the game shutdown.

## Features <a name = "features"></a>

 - Supported versions:
    - [v130090401 (20130917)](https://download.cnet.com/heva-clonia-online/3000-7536_4-76035852.html) by OGPlanet.
 - You can export any model, skeleton, animation and map (MAPs UVs are not finished).

## Information

TLDR: this doesnt work at all but have useful information about creating a private server using it.

**Q: How to make the game connect to the server?**<br>
R: Launch the game using: `./HevaUS.exe 127.0.0.1 27050`

**Q: How can I send a packet to the game? How can I read a packet from the game?**<br>
R: You can't. Both the game and server uses packet obsfucation and both obfuscation methods are different from each other but they are similar.

**Q: Do you know the game packet format?**<br>
R: Yes. Packets are basically: <br>
***[2 byte packet length] [2 byte something] [1 byte length header validation] [1 byte length body validation] [packet body]***<br>
but this is all obfuscated, so you cant read it directly when receiving or sending packets.

**Q: How can I extract the game files?**<br>
R: Using the following [quickbms](https://github.com/LittleBigBug/QuickBMS) script:
```
# Heva Clonia Online (PBZ format)
# 
# Written by Ekey (h4x0r)
# http://forum.xentax.com
# 
# script for QuickBMS http://quickbms.aluigi.org

comtype unzip_dynamic

idstring "PlayBuster package archive v0.02\x1A\x00"
get PSIZE asize
get DUMMY long

do
    get DUMMY threebyte
    get NSIZE byte
    get DUMMY threebyte
    getdstring HASH 12
    get ZSIZE long
    get TERMINATOR byte
    getdstring NAME NSIZE
    savepos OFFSET
    set TEMP = OFFSET
    math TEMP += ZSIZE
    clog NAME OFFSET ZSIZE ZSIZE
    goto TEMP
while TEMP < PSIZE
```

**Q: How do you know all of this? How can I help?**<br>
R: I spent a few months going around using GHidra and IDA, although I didn't make much progress. If you want to help you can use these programs yourself or if you ever used Wireshark to do network captures of this game, it would really help a lot.