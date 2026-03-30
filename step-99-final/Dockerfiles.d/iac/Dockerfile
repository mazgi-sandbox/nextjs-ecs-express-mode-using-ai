FROM hashicorp/terraform:latest

RUN apk add --no-cache shadow su-exec

ARG UID=1000
ARG GID=1000
# Create a user matching the host user's UID/GID so that files written to
# bind-mounted volumes (e.g. .terraform/) are owned by the correct user.
RUN addgroup -g ${GID} developer \
    && adduser -u ${UID} -G developer -D developer

# Cloud credentials are bind-mounted read-only under /mnt. On macOS
# Docker Desktop they appear as root-owned with restrictive permissions,
# so the entrypoint copies them to the developer user's home directory
# with correct ownership before dropping privileges.
RUN printf '#!/bin/sh\n\
for dir in .aws; do\n\
  if [ -d /mnt/$dir ]; then\n\
    mkdir -p /home/developer/$dir\n\
    cp -a /mnt/$dir/. /home/developer/$dir/\n\
    chown -R developer:developer /home/developer/$dir\n\
  fi\n\
done\n\
exec su-exec developer "$@"\n' > /entrypoint.sh && chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
