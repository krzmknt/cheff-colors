import axios from 'axios'

import { IImageSearch } from './ImageProcessor'

// APIキーは環境変数から読み込む
const API_KEY = process.env.GOOGLE_API_KEY || ''

interface GoogleImageSearchResponse {
  value: {
    contentUrl: string
  }[]
}

export const googleImageSearch: IImageSearch = async (options) => {
  const { query, size, numberOfImagesToFetch } = options

  const url = 'https://api.bing.microsoft.com/v7.0/images/search'

  const headers = {
    'Ocp-Apim-Subscription-Key': API_KEY,
  }

  const params = {
    q: query,
    size: size,
    count: numberOfImagesToFetch,
  }

  try {
    const response = await axios.get<GoogleImageSearchResponse>(url, { headers, params })

    // ステータスコードのチェック
    if (response.status !== 200) {
      throw new Error(`Bing image search API returned ${response.status} status code`)
    }

    // レスポンスデータの形式を検証
    if (!response.data || !response.data.value) {
      throw new Error('Bing image search API returned invalid response')
    }

    return response.data.value.map((imageAttr) => ({
      url: imageAttr.contentUrl,
    }))
  } catch (error) {
    console.error(
      'An error occurred while fetching image URLs from Bing image search API:',
      error,
    )
    throw new Error('Failed to fetch image URLs from Bing image search API')
  }
}
