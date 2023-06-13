import {Tle} from "./Tle";

export class TleProvider {

    private static URL: string = "https://tle.ivanstanojevic.me";

    public async search(query: string | null = null): Promise<Tle[]> {

        let url: string = TleProvider.URL + '/api/tle';

        if (query !== null) {
            url += '?search=' + query;
        }

        const response = await fetch(url);
        const data: any = await response.json();

        const result: Tle[] = [];

        if (result.hasOwnProperty('member')) {
            return result;
        }

        data.member.forEach((item: any) => result.push(new Tle(item)));

        return result;
    }

    public async get(id: number): Promise<Tle | null> {
        let url: string = TleProvider.URL + '/api/tle/' + id;

        const response = await fetch(url);
        const data = await response.json();

        if (!data) {
            return null;
        }

        return new Tle(data);
    }

}
