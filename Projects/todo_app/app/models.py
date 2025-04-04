from app import db
from datetime import datetime, timedelta

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.String(200), nullable=False)
    due_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def time_remaining(self):
        return self.due_date - datetime.utcnow()

    def __repr__(self):
        return f"<Task {self.id} - {self.content}>"
