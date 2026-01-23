const dns = require("dns");

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

  // Get domain from request body
  const { domain } = req.body;

  // Validate domain input
  if (!domain) {
    return res.status(400).json({ error: "Domain is required" });
  }

  // Try dns.lookup first
  dns.lookup(domain, (err, address, family) => {
    if (err) {
      // If lookup fails, try dns.resolve as fallback
      dns.resolve(domain, (err, addresses) => {
        if (err) {
          return res.status(500).json({ error: "Could not find this domain" });
        }
        // Return array of addresses
        return res.status(200).json({ addresses });
      });
    } else {
      // Return single address with IP version
      return res.status(200).json({
        address,
        family: family === 4 ? "IPv4" : "IPv6",
      });
    }
  });
};
