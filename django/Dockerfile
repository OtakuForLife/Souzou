# Use an official Python runtime as a parent image
FROM python:3.11

# Set environment variables


# Set the working directory
WORKDIR /app

COPY requirements.txt /app/
RUN pip install -r requirements.txt

# Copy the project code into the container
COPY . /app/

ENTRYPOINT ["python", "manage.py", "runserver", "0.0.0.0:8000"]