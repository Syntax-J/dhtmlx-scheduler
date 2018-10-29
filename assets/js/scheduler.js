$(document).ready(function() {
    var data_url = "/assets/data/JSON_feeder.json";

    var template_class_instructor = function(class_list) {
        let template = "";

        template += "<select class=\"dhx_lightbox_class_select custom-field\" aria-label=\"Class Name\">";

        class_list.forEach(function(class_obj) {
            template += "<option value=\"" + class_obj["value"] + "\">" + class_obj["label"] + "</option>";
        });

        template += "</select>";

        template += "<div class=\"dhx_cal_lsection instructor\"><label>Instructor :</label></div>";

        template += "<div class=\"dhx_cal_lsection instructor-label\"><label>" + class_list[0]["instructor"]["label"] + "</label></div>";

        template += "</select>";

        return template;
    };

    var template_subscribers = function(sub_list) {
        let template = "";

        template += "<select class=\"dhx_lightbox_sub_select custom-field\" aria-label=\"Subscribers\"  multiple=\"multiple\">";

        sub_list.forEach(function(sub_obj) {
            template += "<option value=\"" + sub_obj["value"] + "\">" + sub_obj["label"] + "</option>";
        });

        template += "</select>";

        return template;
    };

    var scheduler_init = function(data_from_url) {
        scheduler.form_blocks["type_cls_ins"] = {
            render: function(sns) { // sns - section configuration object
                return template_class_instructor(data_from_url["collections"]["classes"]);
            },
            set_value: function(node, value, ev) {},
            get_value: function(node, ev) {},
            focus: function(node) {}
        };

        scheduler.form_blocks["type_subscribers"] = {
            render: function(sns) { // sns - section configuration object
                return template_subscribers(data_from_url["collections"]["subscribers"]);
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
            { name: "Details", height: 200, type: "textarea", map_to: "text" },
            { name: "Subscribers", height: 150, type: "type_subscribers", map_to: "subscribers" },
            { name: "time", height: 72, type: "time", map_to: "auto" }
        ];

        scheduler.init("scheduler_here", new Date(), "month");
        scheduler.setLoadMode("month");

        console.log(data_from_url["data"]);
        scheduler.parse(data_from_url["data"], "json");

        let dp = new dataProcessor("/event/api/"); //this api is used for any CRUD actions for backend

        dp.init(scheduler);
        dp.setTransactionMode("REST");

        scheduler.attachEvent("onLightbox", function(id) {
            if (!$(".dhx_lightbox_sub_select").hasClass("select2-offscreen"))
                $(".dhx_lightbox_sub_select").select2();

            let cur_cls_id = $(".dhx_lightbox_class_select").val();

            $(".dhx_lightbox_class_select").change(function(e) {
                cur_cls_id = $(".dhx_lightbox_class_select").val();

                data_from_url["collections"]["classes"].forEach(function(class_obj) {
                    if (class_obj["value"] == cur_cls_id) {
                        $(".dhx_cal_lsection.instructor-label label").text(class_obj["instructor"]["label"]);
                    }
                });
            });

            let event = scheduler.getEvent(id);
            
            if (event.class) {
                $(".dhx_lightbox_class_select").val(event.class).trigger("change");
            }

            if (event.subscribers) {
                $(".dhx_lightbox_sub_select").val(event.subscribers).trigger("change");
            }
        });
    };

    $.getJSON(data_url, function(data_from_url) {
        scheduler_init(data_from_url);
    });
});