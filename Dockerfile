FROM alpine:latest

#Create Bot Directory
WORKDIR /usr/src/chirp-bot-v2
COPY package.json ./

#Installation
RUN apk add --update \
	&& apk add --no-cache nodejs-current \
	     nodejs-npm \
	     cairo-dev \
	     jpeg-dev \
	     pango-dev \
	     giflib-dev \
        # defaults fonts for canvas
       ttf-opensans ttf-dejavu ttf-droid ttf-freefont ttf-liberation ttf-ubuntu-font-family fontconfig \
	&& apk add --no-cache --virtual .gyp git curl build-base python3 make g++  \
	&& npm install \
	&& apk del .gyp

#Copy Project to WORKDIR
ADD . /usr/src/chirp-bot-v2/

#Compile TS to JS
RUN npm run tsc

#Start me!
CMD ["npm", "start"]