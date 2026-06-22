export interface LogHandler {

    onParsed(line: string): Promise<void>;

}
