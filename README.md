# Bazcal API

An simpler REST API for getting invertment recommendations from Hypixel Bazaar API.

# Usage

## Deployment

Deploy using a Docker container, a premade config is included for docker-compose. Simply copy `docker-compose.example.yml` to `docker-compose.yml`

You'll also need to create the RSA keypair in order to generate the API keys. Run this command on a linux based system (with openssh package installed!):

```bash
mkdir keys && cd keys
ssh-keygen -t rsa -b 4096 -m PEM -f jwt.key
openssl rsa -in jwt.key -pubout -outform PEM -out jwt.key.pub
cd ..
```

Now you can build and deploy with docker-compose

```
docker-compose up --build
```

## Endpoints

I'll write the docs later :-)