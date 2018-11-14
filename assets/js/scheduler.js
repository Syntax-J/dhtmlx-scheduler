$(document).ready(function() {
	scheduler.config.details_on_create = true;
	scheduler.config.details_on_dbclick = true;
	scheduler.config.xml_date = "%m/%d/%Y %H:%i";

	scheduler.form_blocks["type_cls_ins"] = {
		render: function(sns) {
			var class_list = scheduler.serverList("classes"),
				template = "";

			template += "<select class=\"dhx_lightbox_class_select custom-field\" aria-label=\"Class Name\">";

			class_list.forEach(function(class_obj) {
				template += "<option value=\"" + class_obj["key"] + "\">" + class_obj["label"] + "</option>";
			});

			template += "</select>";

			template += "<div class=\"dhx_cal_lsection instructor\"><label>Instructor :</label></div>";

			template += "<div class=\"dhx_cal_lsection instructor-label\"><label>" + class_list[0]["instructor"]["label"] + "</label></div>";

			template += "<div class=\"dhx_cal_lsection subscribers-count-label\"><label><span>0</span> / <span>" + class_list[0]["size"] + "</span></label></div>";

			template += "</select>";

			return template;
		},
		set_value: function(node, value, ev) {
			$(node).val(value ? value : scheduler.serverList("classes")[0]["key"]);

			if (!$(node).hasClass("change_event_attached")) {
				$(node).addClass("change_event_attached");

				$(node).on("change", function(e) {
					var max_subscriber_number = scheduler.serverList("classes")[0]["size"];
					var instructor_label = "";
					var class_id = $(this).val()

					scheduler.serverList("classes").forEach(function(class_obj) {
						if (class_obj["key"] == class_id) {
							max_subscriber_number = class_obj["size"];
							instructor_label = class_obj["instructor"]["label"];

							return true;
						}
					});

					node.parentNode.childNodes[3].firstChild.innerHTML = instructor_label; //OK
					node.parentNode.lastChild.firstChild.lastChild.innerHTML = max_subscriber_number; //OK
					scheduler.formSection("subscribers").node.innerHTML = "";

					$.get("/event/get_subscribers.php", {
						"classID": class_id
					}, function(data) {
						var template = "";

						JSON.parse(data).forEach(function(sub_obj) {
							template += "<option data-phone=\"" + sub_obj["phone"] + "\" value=\"" + sub_obj["value"] + "\">" + sub_obj["label"] + "</option>";
						});

						scheduler.formSection("subscribers").node.innerHTML = template;

						var lightbox_id = scheduler.getState().lightbox_id
						scheduler.formSection("subscribers").setValue(scheduler.getState().new_event ? [] : scheduler.getEvent(lightbox_id).subscribers);
					})
				});

			}
		
			$(node).trigger("change"); //why trigger change? => because instructor label, max number texts should be updated when popup dialog opens and class id is changed
			$(node).prop("disabled", scheduler.getState().new_event ? false : true);
		},
		get_value: function(node, ev) {
			return $(node).val();
		},
		focus: function(node) {}
	};

	scheduler.form_blocks["type_subscribers"] = {
		render: function(sns) { //can we load by ajax the datasource options from the server? If we load here the valid subscribere we remove the ajax from below from set_value method.
			return "<select class=\"dhx_lightbox_sub_select custom-field\" aria-label=\"Subscribers\" name=\"subscribers[]\"  multiple=\"multiple\"></select>";
		},
		set_value: function(node, value, ev) {
			if (!node.childNodes.length)
				return;

			if (value) {
				if (value instanceof Array)
					$(node).val(value);
				else
					$(node).val(value.split(","));
			} else {
				$(node).val([]);
			}

			var select2Attrs = {
				maximumSelectionLength: scheduler.serverList("classes")[0]["size"],
				matcher: function(params, data) {
					if (params.term && $(data.element).attr("data-phone").indexOf(params.term) == -1 && $(data.element).text().toLowerCase().indexOf(params.term.toLowerCase()) == -1) {
						return null;
					}
					return data;
				}
			};

			scheduler.serverList("classes").forEach(function(class_obj) {
				if (class_obj["key"] == scheduler.formSection("classid").getValue()) {
					select2Attrs["maximumSelectionLength"] = class_obj["size"];

					return true;
				}
			});

			$(node).select2(select2Attrs);

			if (!$(node).hasClass("change_event_attached")) {//what is this condition? used for what? => to prevent duplicated event hooks
				$(node).addClass("change_event_attached");

				$(node)
				.on("select2:select", function(e) {
					$.get(
						"/event/api.php", {
							"subscriberID": e.params.data.id,
							"classID": scheduler.formSection("classid").getValue()
						},
						function(data) {//can we prevent the eselect2 event? => https://select2.org/programmatic-control/events
							node.childNodes.forEach(function(c_node) {//why iterate? performance affected
								if (c_node.value == e.params.data.id) {
									$(c_node).prop("selected", JSON.parse(data));

									return true;
								}
							});
							if(JSON.parse(data)){
								dhtmlx.alert(e.params.data.text + " Added!")
							}else  dhtmlx.alert(e.params.data.text + " does not have valid subscription!")

							$(node).trigger("change.select2");
						}
					)
				})
				/*.on("select2:unselect", function(e) { //this was added by me like a separate functionality, is the same like select2:select

					var event_id = scheduler.getState().lightbox_id
					$.get("/event/ischeckin", {
						"subscriberID": e.params.data.id,
						"eventid": event_id
					}, function(data) {//can we prevent the eselect2 event?
						node.childNodes.forEach(function(c_node) {
							if (c_node.value == e.params.data.id) {
								$(c_node).prop("selected", JSON.parse(data));

								return true;
							}
						});
						if(JSON.parse(data)){
							dhtmlx.alert(e.params.data.text + " subscriber is in the class!")
						}else  dhtmlx.alert(e.params.data.text + " deleted!")

						$(node).trigger("change.select2");
					})
				})*/
				.on("change", function() {
					if ($(node).val())//why do we need chnage event if we have sesect and unselect defined?
						scheduler.formSection("classid").node.parentNode.lastChild.firstChild.firstChild.innerHTML = $(node).val().length;
					else
						scheduler.formSection("classid").node.parentNode.lastChild.firstChild.firstChild.innerHTML = 0;
				});
			};

			$(node).trigger("change");//why do you trigger again change event?
		},
		get_value: function(node, ev) {
			return $(node).val().join(",");
		},
		focus: function(node) {}
	};

	scheduler.locale.labels.section_classid = "Class";
	scheduler.locale.labels.section_instructor = "Instructor";
	scheduler.locale.labels.section_text = "Text";
	scheduler.locale.labels.section_subscribers = "Subscribers";

	scheduler.config.lightbox.sections = [
		{ name: "classid", height: 75, type: "type_cls_ins", map_to: "classid", options: scheduler.serverList("classes") },
		{ name: "instructor", height: 0, type: "select", map_to: "instructor", options: scheduler.serverList("instructors") },
		{ name: "text", height: 200, type: "textarea", map_to: "text" },
		{ name: "subscribers", height: 150, type: "type_subscribers", map_to: "subscribers", options: [] },
		{ name: "time", height: 72, type: "time", map_to: "auto" }
	];


	scheduler.createTimelineView({
		name: "timeline",
		x_unit: "minute",
		x_date: "%H:%i",
		x_step: 30,
		x_size: 48,
		x_start: 0,
		x_length: 48,
		y_unit: scheduler.serverList("instructors"),
		y_property: "instructor",
		render: "bar"
	});

	scheduler.createUnitsView({
		name: "unit",
		property: "instructor",
		list: scheduler.serverList("instructors")
	});

	scheduler.init("scheduler_here", new Date(), "month");
	scheduler.setLoadMode("month");
	scheduler.load("/event/get_events.php", "json");
	
	var dp = new dataProcessor("/event/get_events.php");

	dp.init(scheduler);
	dp.setTransactionMode("JSON");
});