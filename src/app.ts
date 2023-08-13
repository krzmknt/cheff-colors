export const lambdaHandler = async (event: any, context: any) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      key: 'value',
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  }
}
