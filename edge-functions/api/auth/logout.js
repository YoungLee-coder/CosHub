export async function onRequestPost(context) {
  return new Response(
    JSON.stringify({ success: true, data: { loggedOut: true }, error: null }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': 'coshub_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0',
      },
    }
  )
}