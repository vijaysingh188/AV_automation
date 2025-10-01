

Monosetup onetime:
mongoAtlasUsername:avautomation01_db_user
Password:OW72dD6yUynHHCzo


mongodb+srv://avautomation01_db_user:OW72dD6yUynHHCzo@cluster0.s40plbc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0


Aws Setup:
ssh -i AvkeyAWS.pem ubuntu@52.66.179.118 

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


###########################
activate veny
cd Av_automation/backend
uvicorn main:app --host 0.0.0.0 --port 8000
nohup uvicorn main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &


cd Av_automation/Frontend
npm start -- --host 0.0.0.0
nohup npm start -- --host 0.0.0.0 > frontend.log 2>&1 &


sudo lsof -i :3000
sudo netstat -tulnp | grep 3000
sudo kill -9 <PID>





