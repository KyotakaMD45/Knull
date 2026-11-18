FROM quay.io/lyfe00011/md:beta
RUN git clone https://github.com/KyotakaMD45/Knull.git /root/knull/
WORKDIR /root/knull/
RUN yarn install
CMD ["npm", "start"]