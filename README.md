Documentation coming soon!!!
ssh -i Avkey.pem ubuntu@13.210.205.41

<!-- sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl enable --now docker
sudo systemctl status --now docker
sudo usermod -aG docker ubuntu
newgrp docker
docker --version
docker-compose --version -->

sudo docker run -d --name mongodb -p 27017:27017 mongo


cd backend
sudo docker build -t fastapi-backend .
sudo docker run -d --name fastapi-backend --link mongodb -p 8000:8000 fastapi-backend


cd frontend
sudo docker build -t react-frontend .
sudo docker run -d --name react-frontend -p 3000:3000 react-frontend


docker-compose up -d --build



