from flask import Blueprint, render_template, request, redirect, url_for
from app.models import Task, db
from datetime import datetime, timedelta

main = Blueprint('main', __name__)

@main.route('/')
def index():
    tasks = Task.query.all()
    return render_template('index.html', tasks=tasks)

@main.route('/add', methods=['POST'])
def add_task():
    task_content = request.form['content']
    due_in = int(request.form['due_in'])  # Due in minutes
    due_date = datetime.utcnow() + timedelta(minutes=due_in)
    new_task = Task(content=task_content, due_date=due_date)

    db.session.add(new_task)
    db.session.commit()
    return redirect(url_for('main.index'))

@main.route('/delete/<int:id>')
def delete_task(id):
    task = Task.query.get_or_404(id)
    db.session.delete(task)
    db.session.commit()
    return redirect(url_for('main.index'))
