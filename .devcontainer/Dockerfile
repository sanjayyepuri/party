FROM mcr.microsoft.com/devcontainers/rust:latest

# Include lld linker to improve build times either by using environment variable
# RUSTFLAGS="-C link-arg=-fuse-ld=lld" or with Cargo's configuration file (i.e see .cargo/config.toml).
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
   && apt-get -y install clang lld protobuf-compiler \
   && apt-get autoremove -y && apt-get clean -y

# Install Node.js and npm for bouncer service
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
   && apt-get install -y nodejs

RUN apt-get update && apt-get install gnupg2 -y