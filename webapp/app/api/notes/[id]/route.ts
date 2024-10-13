

export async function GET(request: Request) {
    const body = request.body
    console.log(body);
    return new Response('Note Get', {
      status: 200,
      headers: { },
    })
  }

export async function POST(request: Request) {
    const body = request.body
    console.log(body);
    return new Response('Note Post', {
        status: 200,
        headers: { },
    })
}