export function getWebsiteLogo(websiteOrEmail?: string | null): string {
    if (!websiteOrEmail) return "";
  
    // Extract domain
    let domain = websiteOrEmail.trim();
  
    // If it's an email, get the part after '@'
    if (domain.includes("@")) {
      domain = domain.split("@")[1] || "";
    }
  
    // Strip protocols and paths if a URL was passed
    domain = domain
      .replace(/^https?:\/\//, "") // remove http:// or https://
      .replace(/^www\./, "")       // remove leading www.
      .split("/")[0]               // take only the domain
      .split(":")[0];              // remove port if present
  
    if (!domain) return "";
  
    const token = "pk_X-1ZO13GSgeOoUrIuJ6GMQ";
    const size = 180;
  
    return `https://img.logo.dev/${domain}?token=${token}&size=${size}&retina=true`;
  }