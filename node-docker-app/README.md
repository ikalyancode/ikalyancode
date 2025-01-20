
# Build the Docker image
docker build -t node-docker-app .

# Run the container locally to test
docker run -p 3000:3000 node-docker-app


# Apply deployment and service configuration
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml


# Check pods and service
kubectl get pods
kubectl get svc
