"""
Email service - logs to console in dev.
In production: integrate SMTP (smtplib) or SendGrid.
"""


def send_welcome_email(name: str, email: str, password: str):
    print(f"\n📧 Welcome Email → {name} <{email}>")
    print(f"   Your auto-generated password: {password}")
    print("   (In production this would be sent via SMTP)\n")


def send_password_reset_email(name: str, email: str, new_password: str):
    print(f"\n📧 Password Reset Email → {name} <{email}>")
    print(f"   New password: {new_password}")
    print("   (In production this would be sent via SMTP)\n")
