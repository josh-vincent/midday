# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - img [ref=e5]
    - generic [ref=e7]:
      - img "Background" [ref=e9]
      - generic [ref=e12]:
        - generic [ref=e13]:
          - heading "Welcome Back" [level=1] [ref=e14]
          - paragraph [ref=e15]: Sign in to your account to continue
        - generic [ref=e16]:
          - generic [ref=e18]:
            - generic [ref=e19]:
              - textbox "Email" [ref=e20]
              - textbox "Password" [ref=e21]
            - button "Sign in" [disabled]
          - button "Don't have an account? Sign up" [ref=e23] [cursor=pointer]
          - link "Forgot your password?" [ref=e25] [cursor=pointer]:
            - /url: /forgot-password
        - paragraph [ref=e27]:
          - text: By signing in you agree to our
          - link "Terms of service" [ref=e28] [cursor=pointer]:
            - /url: https://midday.ai/terms
          - text: "&"
          - link "Privacy policy" [ref=e29] [cursor=pointer]:
            - /url: https://midday.ai/policy
  - region "Notifications (F8)":
    - list
  - alert [ref=e30]
```