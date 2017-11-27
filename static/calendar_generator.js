var app = new Vue({
  el: "main",
  data: {
    search: {
      query: "",
      results: "",
      cache: {},
    },
    courses: [],
    semester: "fall"
  },
  methods: {
    displayResults: function (abbr, num) {
      this.search.results = this.search.cache[this.semester][abbr][num];
    },
    generateSummary: function (course) {
      return course.catalog.description +
          " (" + course.catalog.abbr + " " + course.catalog.num + "): " +
          this.generateSummaryWhen(course.when) +
          " with " + course.instructor +
          " in " + course.room + ".";
    },
    generateSummaryWhen: function (when) {
      let whens = [];
      for (let i = 0; i < when.length; ++i) {
        whens.push(
            when[i].pattern +
            " (" + when[i].dates.start + " to " + when[i].dates.end + ")"
        );
      }
      return whens.join(" and ");
    },
    doSearch: function () {
      // Parse for departmental abbreviation and course number
      const query = this.search.query.toUpperCase().match(/([A-Z]+)\s*(\d+)/);
      if (query === null) {
        console.log("Invalid search query");
        return;
      }
      let abbr = query[1];
      let num = query[2];

      // Check the cache first
      if (this.semester in this.search.cache && abbr in this.search.cache[this.semester]
          && num in this.search.cache[this.semester][abbr]) {
        this.displayResults(abbr, num);
        return;
      }

      // Fetch if not in cache
      fetch("https://prv-web.sens.buffalo.edu/apis/schedule2/schedule2/courses" +
            "?semester=" + this.semester + "&abbr=" + abbr + "&num=" + num)
          .then((response) => response.json())
          .then((response) => {
            let results;
            if ("courses" in response) {
              results = response.courses;
              for (let i = 0; i < results.length; ++i) {
                results[i].summary = this.generateSummary(results[i]);
                results[i].isSelected = false;
              }
            } else {
              results = [];
            }

            // Update cache
            if (!(this.semester in this.search.cache)) {
              this.search.cache[this.semester] = {};
            }
            if (!(abbr in this.search.cache[this.semester])) {
              this.search.cache[this.semester][abbr] = {};
            }
            this.search.cache[this.semester][abbr][num] = results;

            this.displayResults(abbr, num);
          })
          .catch((error) => {
            this.search.results = [];
            console.log("Error: " + error);
          });
    },
    select: function (course) {
      course.isSelected = true;
      this.courses.push(course);
    },
    unselect: function (course) {
      course.isSelected = false;
      let index = this.courses.indexOf(course);
      this.courses.splice(index, 1);
    },
    generateCalendar: function () {
      let input = document.createElement("input");
      input.name = "courses";
      input.value = JSON.stringify(this.courses);
      let form = document.createElement("form");
      form.method = "POST";
      form.style.display = "none";
      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
    }
  }
});
