from datetime import datetime, timedelta

from icalendar import Calendar, Event, vRecur
import pytz


TIME_ZONE = pytz.timezone("America/New_York")


def generate_calendar(courses):
    cal = Calendar()
    cal.add("prodid", "-//UB Utils//Calendar Generator 0.0.1//EN")
    cal.add("version", "2.0")

    for course in courses:
        for event in _generate_calendar_event(course):
            cal.add_component(event)

    return cal


def _generate_calendar_event(course):
    summary = "{} {} ({})".format(
        course["catalog"]["abbr"],
        course["catalog"]["num"],
        course["catalog"]["type"])
    description = "Title: {title}\nSection: {section}\nInstructor: {instructor}".format(
        title=course["catalog"]["title"],
        section=course["section"],
        instructor=course["instructor"])
    location = course["room"]

    for when in course["when"]:
        offset = timedelta(days=_get_offset_days(when["days"]))
        start = _parse_date_time(
            when["dates"]["first"],
            when["dates"]["start"]
        ) + offset
        end = _parse_date_time(
            when["dates"]["first"],
            when["dates"]["end"]
        ) + offset
        recurrence_rule = _parse_recurrence_rule(
            when["dates"]["last"],
            when["days"],
            start)

        event = Event()
        event.add("dtstart", start)
        event.add("dtend", end)
        event.add("dtstamp", datetime.now(TIME_ZONE))
        event.add("rrule", recurrence_rule)
        event.add("summary", summary)
        event.add("location", location)
        event.add("description", description)

        yield event


def _parse_date_time(date, time):
    date_time = datetime.strptime("{} {}".format(date, time), "%Y-%m-%d %H:%M")
    return TIME_ZONE.localize(date_time)


def _parse_recurrence_rule(last_date, days, start):
    last = datetime.strptime(last_date, "%Y-%m-%d")
    until = start.replace(year=last.year, month=last.month, day=last.day)
    days = [day[:2] for day, yn in days.items() if yn == "Y"]
    return vRecur(freq="weekly", until=until, byday=days)


def _get_offset_days(days):
    days = {day: yn == "Y" for day, yn in days.items()}
    if days["monday"]:
        return 0
    if days["tuesday"]:
        return 1
    if days["wednesday"]:
        return 2
    if days["thursday"]:
        return 3
    if days["friday"]:
        return 4
    if days["saturday"]:
        return 5
    if days["sunday"]:
        return 6
