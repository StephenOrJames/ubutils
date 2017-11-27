import json

from flask import Flask, redirect, render_template, request, Response, url_for

from lib.calendar import generate_calendar


app = Flask(__name__)


@app.route("/")
def home():
    return redirect(url_for("calendar_generator"))


@app.route("/calendar-generator", methods=["GET", "POST"])
def calendar_generator():
    if request.method == "POST":
        try:
            courses_str = request.form.get("courses", "[]")
            courses = json.loads(courses_str)
        except json.JSONDecodeError:
            return redirect(url_for("calendar_generator")), 400

        calendar = generate_calendar(courses)

        return Response(calendar.to_ical(),
                        mimetype="text/calendar",
                        headers={"Content-Disposition": "attachment;filename=calendar.ics"})
    return render_template("calendar_generator.html")


if __name__ == "__main__":
    app.run()
