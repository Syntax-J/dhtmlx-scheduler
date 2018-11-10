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
                    var class_id = $(this).val()

                    scheduler.serverList("classes").forEach(function(class_obj) {
                        if (class_obj["key"] == class_id) {
                            max_subscriber_number = class_obj["size"];

                            return true;
                        }
                    });

                    node.parentNode.lastChild.firstChild.lastChild.innerHTML = max_subscriber_number;
                    scheduler.formSection("subscribers").setValue([]);
                });

            }

            if (value)
                $(node).prop("disabled", true);
            else
                $(node).prop("disabled", false);

            $(node).trigger("change");
        },
        get_value: function(node, ev) {
            return $(node).val();
        },
        focus: function(node) {}
    };

    scheduler.form_blocks["type_subscribers"] = {
        render: function(sns) {
            var sub_list = sns.options,
                template = "";

            template += "<select class=\"dhx_lightbox_sub_select custom-field\" aria-label=\"Subscribers\" name=\"subscribers[]\"  multiple=\"multiple\">";

            sub_list.forEach(function(sub_obj) {
                template += "<option data-phone=\"" + sub_obj["phone"] + "\" value=\"" + sub_obj["key"] + "\">" + sub_obj["label"] + "</option>";
            });

            template += "</select>";

            return template;
        },
        set_value: function(node, value, ev) {
            $(node).val(value ? value : [])

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
                if (class_obj["key"] == ev.class) {
                    select2Attrs["maximumSelectionLength"] = class_obj["size"];

                    return true;
                }
            })

            $(node).select2(select2Attrs);


            if (!$(node).hasClass("change_event_attached")) {
                $(node).addClass("change_event_attached");

                $(node)
                    .on("select2:select", function(e) {
                        scheduler.serverList("classes").forEach(function(class_obj) {
                            if (class_obj["key"] == scheduler.formSection("class").getValue()) {
                                var subscription_ids = [];

                                class_obj["subscriptions"].forEach(function(subscription_obj) {
                                    subscription_ids.push(subscription_obj["id"]);
                                })

                                $.post(
                                    "/event/api.php", {
                                        "subscriberID": e.params.data.id,
                                        "subscriptions": JSON.stringify(subscription_ids)
                                    },
                                    function(data) {
                                        node.childNodes.forEach(function(c_node) {
                                            if (c_node.value == e.params.data.id) {
                                                $(c_node).prop("selected", JSON.parse(data));

                                                return true;
                                            }
                                        });

                                        $(node).trigger("change.select2");
                                    }
                                )

                            }
                        });
                    })
                    .on("change", function() {
                        if ($(node).val())
                            scheduler.formSection("class").node.parentNode.lastChild.firstChild.firstChild.innerHTML = $(node).val().length;
                        else
                            scheduler.formSection("class").node.parentNode.lastChild.firstChild.firstChild.innerHTML = 0;
                    });
            };

            $(node).trigger("change");
        },
        get_value: function(node, ev) {
            return $(node).val();
        },
        focus: function(node) {}
    };

    scheduler.locale.labels.section_class = "Class";
    scheduler.locale.labels.section_instructor = "Instructor";
    scheduler.locale.labels.section_text = "Text";
    scheduler.locale.labels.section_subscribers = "Subscribers";

    scheduler.config.lightbox.sections = [
        { name: "class", height: 75, type: "type_cls_ins", map_to: "class", options: scheduler.serverList("classes") },
        { name: "instructor", height: 0, type: "select", map_to: "instructor", options: scheduler.serverList("instructors") },
        { name: "text", height: 200, type: "textarea", map_to: "text" },
        { name: "subscribers", height: 150, type: "type_subscribers", map_to: "subscribers", options: scheduler.serverList("subscribers") },
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
        list: scheduler.serverList("instructors"),
    });

    scheduler.attachEvent("onBeforeViewChange", function(old_mode, old_date, mode, date) {
        if (old_date && (old_date.getFullYear() != date.getFullYear() || old_date.getMonth() != date.getMonth())) {
            scheduler.load("/event/get_events.php?year=" + date.getFullYear() + "&month=" + (date.getMonth() + 1), "json");
        }

        return true;
    });


    scheduler.init("scheduler_here", new Date(), "month");
    scheduler.load("/event/get_events.php", "json");

    var dp = new dataProcessor("/event/get_events.php");

    dp.init(scheduler);
    dp.setTransactionMode("JSON");
});