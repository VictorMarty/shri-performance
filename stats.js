function quantile(arr, q) {
    const sorted = arr.sort((a, b) => a - b);
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;

    if (sorted[base + 1] !== undefined) {
        return Math.floor(sorted[base] + rest * (sorted[base + 1] - sorted[base]));
    } else {
        return Math.floor(sorted[base]);
    }
};

const quantilles = (container, data) => {
	container.p25 = quantile(data, 0.25);
	container.p50 = quantile(data, 0.5);
	container.p75 = quantile(data, 0.75);
	container.p95 = quantile(data, 0.95);
}


function prepareData(result) {
	return result.data.map(item => {
		item.date = item.timestamp.split('T')[0];

		return item;
	});
}

// TODO: реализовать
// показать значение метрики за несколько день
function showMetricByPeriod(data, page, name, startDate , endDate) {
	console.log(`metric ${name} for ${startDate}-${endDate}`);
	const dayList = getDaysList(startDate,endDate);
	let table = {}
	for (let day of dayList) {
		table[day] = addMetricByDate(data,page,name,day)
	}
	console.table(table)
}

// показать сессию пользователя
function showSession(data, sessionID) {
	const dataBySession = data.filter(item => item.requestId == sessionID);
	if (dataBySession.length == 0) {
		console.log(`Not find session ${sessionID}`)
	}
	console.log(`Session ${sessionID} with propetries:`)
	console.table(dataBySession[0].additional)
	const metrics = {}
		for (item of dataBySession ) {
			metrics[item.name] = item.value
		}
	console.table(metrics)
}

// сравнить метрику в разных срезах
function compareMetric(data, metric) {
	const result = {
		values: [],
		metric: metric,
		hits: 0,
		acc: 0,
		os: {undefined: 0},
		env: {undefined: 0},
		browser: {undefined: 0},
		platform: {undefined: 0},
		version: {undefined: 0},
	};
	const addValue = (container, value) => {container.hits++; container.acc+=value, container.values.push(value)}
	const addOs = (os, value) => {
		os !== undefined ?
			result.os.hasOwnProperty(os) ?
				addValue(result.os[os], value) :
				result.os[os] = {hits: 1, acc: value, values: [value]}:
			result.os.undefined++}
	const addEnv = (env, value) => {
		env !== undefined ?
			result.env.hasOwnProperty(env) ?
				addValue(result.env[env], value):
				result.env[env] = {hits: 1, acc: value, values: [value]}:
			result.env.undefined++}
	const addBrowser = (browser, value) => {
		browser !== undefined ?
			result.browser.hasOwnProperty(browser) ?
				addValue(result.browser[browser], value):
				result.browser[browser] = {hits: 1, acc: value, values: [value]}:
			result.browser.undefined++}
	const addPlatform = (platform, value) => {
		platform !== undefined ?
			result.platform.hasOwnProperty(platform) ?
				addValue(result.platform[platform], value):
				result.platform[platform] = {hits: 1, acc: value, values: [value]}:
			result.platform.undefined++}
	// const addBrowserVersion = (browser,version,value) => {
	// 		result.browser[browser].hasOwnProperty(version) ?
	// 		addValue(result.browser[browser][version], value):
	// 		result.browser[browser][version] = {hits: 1, acc: value, values: [value]}}
	const add = (item) => {
		const v = item.value;

		addValue(result, v);
		addOs(item.additional.os,v);
		addEnv(item.additional.env,v);
		addBrowser(item.additional.browser, v);
		addPlatform(item.additional.platform,v);
		// addBrowserVersion(item.additional.browser, item.additional.browserVersion,v);
	}




	data.filter(item => item.name == metric).forEach(item => {add(item)})
	quantilles(result, result.values)
	console.log(`metric ${metric}. Hits: ${result.hits}, mean: ${result.acc / result.hits}`)

	Object.filter = (obj, predicate) =>
	Object.fromEntries(Object.entries(obj).filter(predicate));

	console.table(Object.filter(result, ([key, value]) => typeof value !== "object" && key !== "undefined"))
	for (key in result.os) {
		if (typeof result.os[key]  === "object") {
			quantilles(result.os[key], result.os[key].values)
			delete result.os[key].values
		}
	}
	delete result.os.undefined
	console.table(result.os)

	// console.table(Object.filter(result.os, ([key, value]) => typeof value === "object" ))
	for (key in result.platform) {
		if (typeof result.platform[key]  === "object") {
			quantilles(result.platform[key], result.platform[key].values)
			delete result.platform[key].values
		}
	}
	delete result.platform.undefined
	console.table(result.platform)

	for (key in result.browser) {
		if (typeof result.browser[key]  === "object") {
			quantilles(result.browser[key], result.browser[key].values)
			delete result.browser[key].values
		}
	}
	delete result.browser.undefined
	console.table(result.browser)
}



// любые другие сценарии, которые считаете полезными

function getDaysList(startDate, endDate) {
	startDate = new Date(startDate)
	endDate = new Date(endDate)
	const list = []
	for (let dt = new Date(startDate); dt <= endDate; dt.setDate(dt.getDate() + 1)) {
		list.push(dt.toISOString().split("T")[0])
	}
	return list
}



// Пример
// добавить метрику за выбранный день
function addMetricByDate(data, page, name, date) {
	let sampleData = data
					.filter(item => item.page == page && item.name == name && item.date == date)
					.map(item => item.value);

	let result = {};

	result.hits = sampleData.length;
	quantilles(result,sampleData)


	return result;
}
// рассчитывает все метрики за день
function calcMetricsByDate(data, page, date) {
	console.log(`All metrics for ${date}:`);

	let table = {};
	table.init = addMetricByDate(data, page, 'init', date);
	table.redirect = addMetricByDate(data, page, 'redirect', date);
	table.appCache = addMetricByDate(data, page, 'app-cache', date);
	table.dns = addMetricByDate(data, page, 'dns', date);
	table.tcp = addMetricByDate(data, page, 'tcp', date);
	table.request = addMetricByDate(data, page, 'request', date);
	table.response = addMetricByDate(data, page, 'response', date);
	table.interactive = addMetricByDate(data, page, 'interactive', date);
	table.contentLoaded = addMetricByDate(data, page, 'content-loaded', date);
	table.complete = addMetricByDate(data, page, 'complete', date);
	table.ready = addMetricByDate(data, page, 'ready', date);
	table.load = addMetricByDate(data, page, 'load', date);


	console.table(table);
};

fetch('https://shri.yandex/hw/stat/data?counterId=5aba2568-44e7-4214-9aed-0b742f3a8932')
	.then(res => res.json())
	.then(result => {
		let data = prepareData(result);
		calcMetricsByDate(data, 'page', '2021-10-30');
		showMetricByPeriod(data,'page',"tcp", '2021-10-25', '2021-10-30');
		showSession(data, "491092103607")
		compareMetric(data, "ready")
	});

