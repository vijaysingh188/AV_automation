

Monosetup onetime:
mongoAtlasUsername:avautomation01_db_user
Password:OW72dD6yUynHHCzo


mongodb+srv://avautomation01_db_user:OW72dD6yUynHHCzo@cluster0.s40plbc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0


Aws Setup:
ssh -i AvkeyAWS.pem ubuntu@52.66.179.118   --

sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl enable --now docker
sudo systemctl status --now docker
sudo usermod -aG docker ubuntu
newgrp docker
docker --version
docker-compose --version


git clone https://github.com/vijaysingh188/AV_automation.git
cd AV_automation

npm install
npm run build


docker-compose up -d --build

<!-- steps to stop and re-run -->
docker-compose down --remove-orphans
docker system prune -af
docker-compose build --no-cache
docker-compose up -d






