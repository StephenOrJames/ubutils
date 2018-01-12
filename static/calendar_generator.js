var app = new Vue({
  el: 'main',

  data: {
    isLoading: false, // indicates that we are waiting for an external response
    search: {
      query: '',
      results: '',
      cache: {},
    },
    courses: [],
    semesters: {
      all: {
        'fall': 'Fall',
        'winter': 'Winter',
        'spring': 'Spring',
        'summer': 'Summer',
      },
      selected: 'spring',
    },
  },

  methods: {
    displayResults(abbr, num) {
      this.search.results = this.search.cache[this.semesters.selected][abbr][num];
    },

    generateSummary(course) {
      return course.catalog.description +
          ` (${course.catalog.abbr} ${course.catalog.num}): ` +
          this.generateSummaryWhen(course.when) +
          ` with ${course.instructor} in ${course.room}.`;
    },

    generateSummaryWhen(when) {
      let whens = [];
      for (let i = 0; i < when.length; ++i) {
        whens.push(
            `${when[i].pattern} (${when[i].dates.start} to ${when[i].dates.end})`
        );
      }
      return whens.join(" and ");
    },

    doSearch(updateBrowserHistory) {
      // Parse for departmental abbreviation and course number
      const query = this.search.query.toUpperCase().match(/([A-Z]+)\s*(\d+)/);
      if (query === null) {
        console.log('Invalid search query');
        return;
      }
      const abbr = query[1];
      const num = query[2];
      const semester = this.semesters.selected;

      // Check the cache first
      if (semester in this.search.cache
          && abbr in this.search.cache[semester]
          && num in this.search.cache[semester][abbr]) {
        this.displayResults(abbr, num);
        if (updateBrowserHistory) this.updateUrl(abbr, num);
        return;
      }

      // Fetch if not in cache
      this.isLoading = true;
      fetch('https://prv-web.sens.buffalo.edu/apis/schedule2/schedule2/courses' +
            `?semester=${semester}&abbr=${abbr}&num=${num}`)
          .then((response) => response.json())
          .then((response) => {
            let results;
            if ('courses' in response) {
              results = response.courses;
              for (let i = 0; i < results.length; ++i) {
                results[i].summary = this.generateSummary(results[i]);
                results[i].isSelected = false;
              }
            } else {
              results = [];
            }

            // Update cache
            if (!(semester in this.search.cache)) {
              this.search.cache[semester] = {};
            }
            if (!(abbr in this.search.cache[semester])) {
              this.search.cache[semester][abbr] = {};
            }
            this.search.cache[semester][abbr][num] = results;

            this.displayResults(abbr, num);
          })
          .then(() => {
            this.isLoading = false;

            if (updateBrowserHistory) this.updateUrl(abbr, num);
          })
          .catch((error) => {
            this.search.results = [];
            console.log('Error: ' + error);
          });
    },

    select(course) {
      course.isSelected = true;
      this.courses.push(course);
    },

    unselect(course) {
      course.isSelected = false;
      const index = this.courses.indexOf(course);
      this.courses.splice(index, 1);
    },

    generateCalendar() {
      const input = document.createElement('input');
      input.name = 'courses';
      input.value = JSON.stringify(this.courses);
      const form = document.createElement('form');
      form.method = 'POST';
      form.style.display = 'none';
      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
    },

    updateUrl(abbr, num) {
      const semester = this.semesters.selected;
      const url = document.location.pathname +
          `?semester=${semester}&course=${abbr}+${num}`;
      history.pushState({}, null, url);
    },

    restoreFromUrl() {
      if (window.URL === undefined) return;

      const url = new URL(document.location.href);
      const params = url.searchParams;
      const course = params.get('course');
      let semester = params.get('semester');

      if (semester !== null) {
        semester = semester.toLowerCase();
        if (semester in this.semesters.all) {
          this.semesters.selected = semester;
        } else {
          console.log('Invalid semester in URL');
        }
      }

      if (!!course) {
        this.search.query = course;
        this.doSearch();
      }
    },
  },

  mounted() {
    window.onpopstate = this.restoreFromUrl;
    this.restoreFromUrl();
  },
});
