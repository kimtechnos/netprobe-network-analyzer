const dns = require("dns");
const { promisify } = require("util");

const lookup = promisify(dns.lookup);
const resolve = promisify(dns.resolve);

// Vercel serverless function
module.exports = async (req, res) => {
  // Enable CORS so frontend can call this API
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Parse request body (Vercel may not auto-parse)
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ error: "Invalid JSON" });
    }
  }

  // Get domain from request body
  const { domain } = body;

  // Validate domain input
  if (!domain) {
    return res.status(400).json({ error: "Domain is required" });
  }

  try {
    // Try dns.lookup first
    const result = await lookup(domain);
    const address = result.address || result;
    const family = result.family || 4;
    
    return res.status(200).json({
      address,
      family: family === 4 ? "IPv4" : "IPv6",
    });
  } catch (err) {
    // If lookup fails, try dns.resolve as fallback
    try {
      const addresses = await resolve(domain);
      return res.status(200).json({ addresses: Array.isArray(addresses) ? addresses : [addresses] });
    } catch (resolveErr) {
      return res.status(500).json({ error: "Could not find this domain" });
    }
  }
};
