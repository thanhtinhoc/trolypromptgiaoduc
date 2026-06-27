export default async function handler(req: any, res: any) {
  const hasEnvKey = !!process.env.GEMINI_API_KEY && 
                    process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY" && 
                    process.env.GEMINI_API_KEY.trim() !== "";
  return res.status(200).json({ success: true, hasEnvKey });
}
