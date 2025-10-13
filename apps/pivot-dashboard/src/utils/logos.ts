export function getWebsiteLogo(website?: string | null, email?: string | null) {
  let domain: string;
  if (!website || !email) return "";

  //Extract domain out of email if website is not provided
  domain = email.split("@")[1] || "";
  if(!domain) return "";
  
  return `https://img.logo.dev/${domain}?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ&size=180&retina=true`;
}
