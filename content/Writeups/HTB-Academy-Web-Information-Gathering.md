---
title: "HTB Academy: Web Information Gathering"
date: 2026-08-04
draft: false
---
# Question 1

**What is the IANA ID of the registrar of the inlanefreight.com domain?**

Perform a `whois` check to find the `IANA ID`

```sh
whois inlanefreight.com
```

The Registrar IANA ID is `468`

![[Pasted image 20260805175050.png]]
*whois query identifying the IANA ID as 468*

# Question 2

**What http server software is powering the inlanefreight.htb site on the target system? Respond with the name of the software, not the version, e.g., Apache.**

Start with updating `/etc/hosts` to resolve the `inlanefreight.htb` domain to the target IP.

```sh
echo "154.57.164.75" inlanefreight.htb | sudo tee -a /etc/hosts
```

Visiting the page shows a page with just plain text

![[Pasted image 20260805230601.png]]
*Main page of inlanefreight.htb:30352*

Perform web server request for header and banner on `inlanefreight.htb`, revealing the server software as `nginx`.

```sh
curl -IL http://inlanefreight.htb:30352
```

![[Pasted image 20260805224729.png]]
*Web header and banner response revealing server software as nginx*

# Question 3

**What is the API key in the hidden admin directory that you have discovered on the target system?**

To find the hidden admin directory, perform subdomain enumeration using `ffuf`.

Start with capturing the host header word count with non-existent subdomain, to filter out by the response size.

```sh
curl -s -H "Host: nonexistent-random-string123.inlanefreight.htb:30352" http://inlanefreight.htb:30352 | wc -c
```

In this case this returned `120`, supply this number to the `-fs` field on the `ffuf` fuzz.

```sh
ffuf -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-110000.txt -u http://inlanefreight.htb:30352 -H "Host: FUZZ.inlanefreight.htb:30352" -fs 120 -t 100
```

This discovers the subdomain `web1337`

![[Pasted image 20260805225832.png]]
*Subdomain enumeration tool `ffuf` discovers  subdomain `web1337`*

Add this subdomain to `/etc/hosts`

```sh
echo "154.57.164.75" web1337.inlanefreight.htb | sudo tee -a /etc/hosts
```

Visiting this subdomain shows page with plain text

![[Pasted image 20260805230728.png]]
*Main page of web1337.inlanefreight.htb:30352*

Perform directory enumeration on the discovered subdomain. This reveals `robots.txt`

```sh
gobuster dir -u http://web1337.inlanefreight.htb:30352/ -w /usr/share/seclists/Discovery/Web-Content/common.txt
```

![[Pasted image 20260805231004.png]]
*Directory enumeration reveals robots.txt*

Visiting `http://web1337.inlanefreight.htb:30352/robots.txt` reveals hidden path to `/admin_h1dd3n`.

```html
User-agent: *
Allow: /index.html
Allow: /index-2.html
Allow: /index-3.html
Disallow: /admin_h1dd3n
```

Visiting `http://web1337.inlanefreight.htb:30352/robots.txt` shows the API key

![[Pasted image 20260805232206.png]]
*API key found in hidden admin directory*

# Question 4

**After crawling the inlanefreight.htb domain on the target system, what is the email address you have found? Respond with the full email, e.g., mail@inlanefreight.htb.**

So far we have had only plain text pages without any links to crawl.

Perform further subdomain enumeration from `web1337.inlanefreight.htb` using same `ffuf` method

Start with capturing the host header word count with non-existent subdomain, to filter out by the response size.

```sh
curl -s -H "Host: nonexistent-random-string123.web1337.inlanefreight.htb:30352" http://inlanefreight.htb:30352 | wc -c
```

This returned `120`, supply this number to the `-fs` field on the `ffuf` fuzz.

```sh
ffuf -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-110000.txt -u http://web1337.inlanefreight.htb:30352 -H "Host: FUZZ.web1337.inlanefreight.htb:30352" -fs 120 -t 100
```

This found `dev`

![[Pasted image 20260805233317.png]]
*Subdomain enumeration tool `ffuf` discovers  subdomain `dev`*

Add this subdomain to `/etc/hosts`

```sh
echo "154.57.164.75 dev.web1337.inlanefreight.htb" | sudo tee -a /etc/hosts
```

Visiting `http://dev.web1337.inlanefreight.htb:30352/` shows a page with link to another page, clicking the link leads to another page.

![[Pasted image 20260805233504.png]]
*Main page of dev.web1337.inlanefreight.htb:30352*

Use a web crawler to navigate the pages

```sh
python3 ~/tools/ReconSpider.py http://dev.web1337.inlanefreight.htb:30352
```

This outputs a `results.json` file to view, which discovers an email address `1337testing@inlanefreight.htb`

```sh
cat results.json
```

![[Pasted image 20260805235636.png]]
*Web crawler result finding email*

# Question 5

**What is the API key the inlanefreight.htb developers will be changing too?**

The same `results.json` also reveals a comment on a page by the developer of the future API key

![[Pasted image 20260805235636.png]]
*Web crawler result finding comment left by developers on future API key*