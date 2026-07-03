import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      provider?: string
    } & DefaultSession["user"]
  }
}
