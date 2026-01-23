const express = require("express");
const cors = require("cors");
const dns = require("dns");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("."));

// Support both local `/lookup` and Vercel-style `/api/lookup` paths
app.post(["/lookup", "/api/lookup"], (req, res) => {
  const { domain } = req.body;

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
        res.json({ addresses });
      });
    } else {
      res.json({
        address,
        family: family === 4 ? "IPv4" : "IPv6",
      });
    }
  });
});

app.listen(PORT, () => {
  console.log(`netprobe app listening at http://localhost:${PORT}`);
});
