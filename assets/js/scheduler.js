$(document).ready(function() {
    var data_url = "/assets/data/JSON_feeder.json";

    var change_value_to_key = function(list) {
        let c_list = [];

        for (let idx = 0; idx < list.length; idx++) {
            let keys = Object.keys(list[idx]);
            let tmp = list[idx];

            for (let j = 0; j < keys.length; j++) {
                if (keys[j] == "value") {
                    tmp["key"] = list[idx][keys[j]];
                    delete tmp["value"];
                }
            }

            c_list.push(tmp);
        }

        return c_list;
    }

    var template_class_instructor = function(class_list) {
        let template = "";

        template += "<select class=\"dhx_lightbox_class_select custom-field\" aria-label=\"Class Name\">";

        class_list.forEach(function(class_obj) {
            template += "<option value=\"" + class_obj["value"] + "\">" + class_obj["label"] + "</option>";
        });

        template += "</select>";

        template += "<div class=\"dhx_cal_lsection instructor\"><label>Instructor :</label></div>";

        template += "<div class=\"dhx_cal_lsection instructor-label\"><label>" + class_list[0]["instructor"]["label"] + "</label></div>";

        template += "<div class=\"dhx_cal_lsection subscribers-count-label\"><label><span>0</span> / <span>" + class_list[0]["size"] + "</span></label></div>";

        template += "</select>";

        return template;
    };

    var template_subscribers = function(sub_list) {
        let template = "";

        template += "<select class=\"dhx_lightbox_sub_select custom-field\" aria-label=\"Subscribers\" name=\"subscribers[]\"  multiple=\"multiple\">";

        sub_list.forEach(function(sub_obj) {
            template += "<option data-phone=\"" + sub_obj["phone"] + "\" value=\"" + sub_obj["value"] + "\">" + sub_obj["label"] + "</option>";
        });

        template += "</select>";

        return template;
    };

    var select2_events = function(classes, e) {
        $(".dhx_lightbox_sub_select option[value=" + e.params.data.id + "]").prop("selected", false);
        $(".dhx_lightbox_sub_select").trigger("change.select2");

        let cur_cls_id = $(".dhx_lightbox_class_select").val();

        classes.forEach(function(class_obj) {
            if (class_obj["value"] == cur_cls_id) {
                let subscription_ids = [];

                class_obj["subscriptions"].forEach(function(subscription_obj) {
                    subscription_ids.push(subscription_obj["id"]);
                })

                $.post(
                    "/event/api.php", {
                        "subscriberID": e.params.data.id,
                        "subscriptions": JSON.stringify(subscription_ids)
                    },
                    function(data) {
                        if (JSON.parse(data)) {
                            $(".dhx_lightbox_sub_select option[value=" + e.params.data.id + "]").prop("selected", JSON.parse(data));
                            $(".dhx_lightbox_sub_select").trigger("change.select2");
                        } else { alert("false"); }
                    }
                )
            }
        });

    };

    var scheduler_init = function(collections) {
        scheduler.form_blocks["type_cls_ins"] = {
            render: function(sns) { // sns - section configuration object
                return template_class_instructor(collections["classes"]);
            },
            set_value: function(node, value, ev) {},
            get_value: function(node, ev) {},
            focus: function(node) {}
        };

        scheduler.form_blocks["type_subscribers"] = {
            render: function(sns) { // sns - section configuration object
                return template_subscribers(collections["subscribers"]);
            },
            set_value: function(node, value, ev) {},
            get_value: function(node, ev) {},
            focus: function(node) {}
        };

        //here you should init the scheduler using dhtmlx
        scheduler.config.details_on_create = true;
        scheduler.config.details_on_dbclick = true;
        scheduler.config.xml_date = "%m/%d/%Y %H:%i";

        scheduler.config.lightbox.sections = [
            { name: "Class", height: 75, type: "type_cls_ins", map_to: "class" },
            { name: "Instructor", height: 0, type: "select", map_to: "instructor", options: change_value_to_key(collections["instructors"]) },
            { name: "readOnly", height: 0, type: "select", map_to: "readOnly", options: [{ key: false, label: "False" }, { key: true, label: "True" }] },
            { name: "Details", height: 200, type: "textarea", map_to: "text" },
            { name: "Subscribers", height: 150, type: "type_subscribers", map_to: "subscribers" },
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
            y_unit: change_value_to_key(collections["instructors"]),
            y_property: "instructor",
            render: "bar"
        });

        scheduler.createUnitsView({
            name: "unit",
            property: "instructor",
            list: change_value_to_key(collections["instructors"])
        });

        scheduler.attachEvent("onLightbox", function(id) {
            let select2Attrs = {
                maximumSelectionLength: collections["classes"][0]["size"],
                matcher: function(params, data) {
                    if (params.term) {
                        if ($(data.element).attr("data-phone").indexOf(params.term) == -1 && $(data.element).text().toLowerCase().indexOf(params.term.toLowerCase()) == -1)
                            return null;
                    }

                    return data;
                }
            };

            if (!$(".dhx_lightbox_sub_select").hasClass("select2-hidden-accessible")) {
                $(".dhx_lightbox_sub_select").select2(select2Attrs)
                    .on("select2:select", function(e) { select2_events(collections["classes"], e) })
                    .on("change", function(e) {
                        if ($(this).val())
                            $(".dhx_cal_lsection.subscribers-count-label label span:first-child").text($(this).val().length);
                    });
            }

            let cur_cls_id = $(".dhx_lightbox_class_select").val();

            $(".dhx_lightbox_class_select").change(function(e) {
                $(".dhx_lightbox_sub_select").val([]).trigger("change");
                cur_cls_id = $(".dhx_lightbox_class_select").val();

                collections["classes"].forEach(function(class_obj) {
                    if (class_obj["value"] == cur_cls_id) {
                        select2Attrs["maximumSelectionLength"] = class_obj["size"];
                        $(".dhx_lightbox_sub_select").select2(select2Attrs);

                        $(".dhx_cal_lsection.instructor-label label").text(class_obj["instructor"]["label"]);
                        $(".dhx_cal_lsection.subscribers-count-label label span:first-child").text(0);
                        $(".dhx_cal_lsection.subscribers-count-label label span:last-child").text(class_obj["size"]);
                    }
                });
            });

            let event = scheduler.getEvent(id);

            if (event.class) {
                $(".dhx_lightbox_class_select").val(event.class).trigger("change");
                $(".dhx_lightbox_class_select").prop("disabled", true);
            } else {
                $(".dhx_lightbox_class_select").val(collections["classes"][0]["value"]).trigger("change");
                $(".dhx_lightbox_class_select").prop("disabled", false);
            }

            if (event.readOnly == true || event.readOnly == "true")
                $(".dhx_lightbox_sub_select").prop("disabled", true);
            else
                $(".dhx_lightbox_sub_select").prop("disabled", false);

            if (event.subscribers) {
                $(".dhx_lightbox_sub_select").val(event.subscribers).trigger("change");
            } else {
                $(".dhx_lightbox_sub_select").val([]).trigger("change");
            }
        });

        scheduler.attachEvent("onEventSave", function(id, ev, is_new) {
            if (!ev.class) {
                ev.class = $(".dhx_lightbox_class_select").val();

                collections["classes"].forEach(function(class_obj) {
                    if (class_obj["value"] == ev.class) {
                        ev.instructor = class_obj["instructor"]["value"];
                    }
                });
            }

            if (!ev.subscribers) {
                ev.subscribers = $(".dhx_lightbox_sub_select").val() || [];
            }

            ev.readOnly = ev.subscribers ? true : false;

            return true;
        });

        scheduler.attachEvent("onBeforeViewChange", function(old_mode, old_date, mode, date) {
            if (old_date && (old_date.getFullYear() != date.getFullYear() || old_date.getMonth() != date.getMonth())) {
                $.get("/event/get_events.php", { "year": date.getFullYear(), "month": date.getMonth() + 1 }, function(event_list) {
                    scheduler.parse(event_list, "json");
                });
            }

            return true;
        });
    };

    $.getJSON("/event/get_collections.php", function(collections) {
        scheduler_init(collections);

        $.get("/event/get_events.php", function(data) {

            scheduler.init("scheduler_here", new Date(), "month");
            scheduler.setLoadMode("month");

            scheduler.parse(data, "json");

            let dp = new dataProcessor("/event/api.php"); //this api is used for any CRUD actions for backend

            dp.init(scheduler);
            dp.setTransactionMode("REST");

        });
    });
});