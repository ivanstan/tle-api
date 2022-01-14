export class TlePopularProvider {

  private static URL: string = "https://tle.ivanstanojevic.me"

  public async get(): Promise<any | null> {
    let url: string = TlePopularProvider.URL + '/api/tle/popular'

    const response = await fetch(url)
    const data = await response.json()

    if (!data) {
      return null
    }

    return data.member
  }
}
