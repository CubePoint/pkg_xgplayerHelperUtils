declare var _default: DevLogger;
export default _default;
declare class DevLogger {
    _status: boolean;
    _level: string;
    /**
     * @return {*|boolean|boolean}
     */
    get enable(): any;
    /**
     * @return {boolean}
     */
    get long(): boolean;
}
