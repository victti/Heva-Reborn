import HevaProtocolReader from "../../network/hevaProtocolReader";

export default interface IProtocolRead
{
    write(w: HevaProtocolReader): void;
}