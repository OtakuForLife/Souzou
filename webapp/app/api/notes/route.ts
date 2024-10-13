export async function GET(request: Request) {
    const body = request.body
    console.log(body);
    return new Response('Note Get', {
      status: 200,
      headers: { },
    })
}