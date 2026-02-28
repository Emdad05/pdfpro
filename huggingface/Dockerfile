FROM gotenberg/gotenberg:8

# Hugging Face Spaces requires port 7860
# and runs as user 1000

USER root

# Create user expected by HF Spaces
RUN useradd -m -u 1000 -s /bin/sh user 2>/dev/null || true

# Switch to user
USER user

# Gotenberg listens on port 7860 for HF Spaces
CMD ["gotenberg", \
  "--api-port=7860", \
  "--api-timeout=60s", \
  "--libreoffice-restart-after=10", \
  "--chromium-restart-after=10", \
  "--log-level=info"]
