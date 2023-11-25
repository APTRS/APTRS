
"use strict";

/* ** updateScores **
 *
 * Updates Base, Temporal and Environmental Scores, and the Vector String (both in the web page and
 * in the fragment of the URL - the part after the "#").
 * If scores and vectors cannot be generated because the user has not yet selected values for all the Base Score
 * metrics, messages are displayed explaining this.
 */
function updateScores()
{
    var result = CVSS31.calculateCVSSFromMetrics (
      inputValue( 'input[type="radio"][name=AV]:checked'  ),
      inputValue( 'input[type="radio"][name=AC]:checked'  ),
      inputValue( 'input[type="radio"][name=PR]:checked'  ),
      inputValue( 'input[type="radio"][name=UI]:checked'  ),
      inputValue( 'input[type="radio"][name=S]:checked'  ),

      inputValue( 'input[type="radio"][name=C]:checked'   ),
      inputValue( 'input[type="radio"][name=I]:checked'   ),
      inputValue( 'input[type="radio"][name=A]:checked'   ),

      inputValue( 'input[type="radio"][name=E]:checked'   ),
      inputValue( 'input[type="radio"][name=RL]:checked'  ),
      inputValue( 'input[type="radio"][name=RC]:checked'  ),

      inputValue( 'input[type="radio"][name=CR]:checked'  ),
      inputValue( 'input[type="radio"][name=IR]:checked'  ),
      inputValue( 'input[type="radio"][name=AR]:checked'  ),
      inputValue( 'input[type="radio"][name=MAV]:checked' ),
      inputValue( 'input[type="radio"][name=MAC]:checked' ),
      inputValue( 'input[type="radio"][name=MPR]:checked' ),
      inputValue( 'input[type="radio"][name=MUI]:checked' ),
      inputValue( 'input[type="radio"][name=MS]:checked'  ),
      inputValue( 'input[type="radio"][name=MC]:checked'  ),
      inputValue( 'input[type="radio"][name=MI]:checked'  ),
      inputValue( 'input[type="radio"][name=MA]:checked'  ));

    if (result.success === true) {

      // Hide text warning that scores, etc., cannot be calculated until user has selected a value for every Base Metric.
      var L=document.querySelectorAll(".needBaseMetrics"), i=L.length;
      while(i--) {
        hide(L[i]);
      }

      parentNode( text("#baseMetricScore", result.baseMetricScore ), '.scoreRating').className = 'scoreRating '+result.baseSeverity.toLowerCase();
      text("#baseSeverity", "(" + result.baseSeverity + ")" );

      //parentNode( text("#temporalMetricScore", result.temporalMetricScore ), '.scoreRating').className = 'scoreRating '+result.temporalSeverity.toLowerCase();
      //text("#temporalSeverity", "(" + result.temporalSeverity + ")" );

      //parentNode( text("#environmentalMetricScore", result.environmentalMetricScore ), '.scoreRating').className = 'scoreRating '+result.environmentalSeverity.toLowerCase();
      //text("#environmentalSeverity", "(" + result.environmentalSeverity + ")" );

      show( inputValue("#vectorString", result.vectorString ) );

      // Update the Vector String in the URL.
      window.location.hash = result.vectorString;

    } else if (result.error === "Not all base metrics were given - cannot calculate scores.") {

      // Show text warning that scores, etc., cannot be calculated until user has selected a value for every Base Metric.
      var L=document.querySelectorAll(".needBaseMetrics"), i=L.length;
      while(i--) {
        show(L[i]);
      }

      hide( "#vectorString" );


    }
}

function delayedUpdateScores()
{
    setTimeout(updateScores, 100);
}

window.Element && function(ElementPrototype) {
    ElementPrototype.matchesSelector = ElementPrototype.matchesSelector ||
    ElementPrototype.mozMatchesSelector ||
    ElementPrototype.msMatchesSelector ||
    ElementPrototype.oMatchesSelector ||
    ElementPrototype.webkitMatchesSelector ||
    function (selector) {
        var node = this, nodes = (node.parentNode || node.document).querySelectorAll(selector), i = -1;
        while (nodes[++i] && nodes[i] != node);
        return !!nodes[i];
    }
}(Element.prototype);

var matchesSelector = function(node, selector) {
    if(!('parentNode' in node) || !node.parentNode) return false;
    return Array.prototype.indexOf.call(node.parentNode.querySelectorAll(selector)) != -1
};


function node()
{
    for(var i=0;i<arguments.length;i++) {
        var o=arguments[i];
        if(typeof(o)=='string' && o) return document.querySelector(o);
        else if('nodeName' in o) return o;
        else if('jquery' in o) return o.get(0);
    }
    return false;
}

function parentNode(p, q)
{
    if(!p || !(p=node(p))) return;
    else if((typeof(q)=='string' && p.matchesSelector(q))||p==q) return p;
    else if(p.nodeName.toLowerCase()!='html') return parentNode(p.parentNode, q);
    else return;
}

function bind(q, tg, fn) {
    var o=node(q);
    if(!o) return;
    if (o.addEventListener) {
        o.addEventListener(tg, fn, false);
    } else if (o.attachEvent) {
        o.attachEvent('on'+tg, fn);
    } else {
        o['on'+tg] = fn;
    }
    return o;
}


function text(q, s)
{
    var e=node(q);
    if(!e) return;
    if(arguments.length>1) {
        if('textContent' in e) {
            e.textContent = s;
        } else {
            e.innerText = s;
        }
        return e;
    }
    return e.textContent || e.innerText;
}

function hide(q)
{
    var e=node(q);
    if(!e) return;
    e.setAttribute('style','display:none');
    return e;
}

function show(q)
{
    var e=node(q);
    if(!e) return;
    //e.removeAttribute('style');
    e.setAttribute('style','display:inline-block');
    return e;
}

function inputValue(q, v)
{
    var e=document.querySelector(q);
    if(!e || e.nodeName.toLowerCase()!='input') return;
    if(arguments.length>1) {
        e.value = v;
        return e;
    }
    return e.value;
}


/* ** setMetricsFromVector **
 *
 * Takes a Vector String and sets the metrics on the web page according to the values passed. The string passed
 * is fully validated, so it is okay to pass untrusted user input to this function. If validation fails, the
 * string "VectorMalformed" is returned and no changes are made to form field values.
 *
 * All base metrics must be specified. If they are not, the string "NotAllBaseMetricsProvided" is returned and no
 * changes are made to form field values. Temporal and Environmental metrics are optional and default to the value
 * "X" if not specified.
 *
 * If validation succeeds and all base metrics are provided, the form fields are set and "true" is returned.
 *
 * The standard prohibits a metric value being specified more than once, but this function does not prevent this
 * and uses the value of the last occurrence.
 */
function setMetricsFromVector ( vectorString ) {

    var result = true;
    var urlMetric;

    var metricValuesToSet = {
        AV: undefined, AC: undefined, PR: undefined, UI: undefined, S: undefined, C: undefined, I: undefined, A: undefined,
        E: "X", RL: "X", RC: "X",
        CR: "X", IR: "X", AR: "X", MAV: "X", MAC: "X", MPR: "X", MUI: "X", MS: "X", MC: "X", MI: "X", MA: "X"
    }

    // A regular expression to validate that a CVSS 3.1 vector string is well formed. It checks metrics and metric values, but
    // does not check that all base metrics have been supplied. That check is done later.
    var vectorStringRegex_31 = /^CVSS:3.1\/((AV:[NALP]|AC:[LH]|PR:[UNLH]|UI:[NR]|S:[UC]|[CIA]:[NLH]|E:[XUPFH]|RL:[XOTWU]|RC:[XURC]|[CIA]R:[XLMH]|MAV:[XNALP]|MAC:[XLH]|MPR:[XUNLH]|MUI:[XNR]|MS:[XUC]|M[CIA]:[XNLH])\/)*(AV:[NALP]|AC:[LH]|PR:[UNLH]|UI:[NR]|S:[UC]|[CIA]:[NLH]|E:[XUPFH]|RL:[XOTWU]|RC:[XURC]|[CIA]R:[XLMH]|MAV:[XNALP]|MAC:[XLH]|MPR:[XUNLH]|MUI:[XNR]|MS:[XUC]|M[CIA]:[XNLH])$/;

    if (vectorStringRegex_31.test(vectorString)) {

        var urlMetrics = vectorString.substring("CVSS:3.1/".length).split("/");

        for (var p in urlMetrics) {
            var urlMetric = urlMetrics[p].split(":");

            metricValuesToSet[urlMetric[0]] = urlMetric[1];
        }

        // Only if *all* base metrics have been provided, directly set form fields to the required values.
        if (metricValuesToSet.AV !== undefined &&
            metricValuesToSet.AC !== undefined &&
            metricValuesToSet.PR !== undefined &&
            metricValuesToSet.UI !== undefined &&
            metricValuesToSet.S  !== undefined &&
            metricValuesToSet.C  !== undefined &&
            metricValuesToSet.I  !== undefined &&
            metricValuesToSet.A  !== undefined) {

            // The correct form field to set can be worked out from the metric acronym and value due to the naming
            // convention used on the web page. For example, setting Access Vector (AV) to Physical (P) requires
            // the form field with the id "AV_P" to be checked.

            for (var p in metricValuesToSet) {
              document.getElementById(p + "_" + metricValuesToSet[p]).checked = true;
            }
        } else {
            result = "NotAllBaseMetricsProvided";
        }

    } else {
      result = "MalformedVectorString";
    }

    // Field values have been set directly, rather than by the user clicking form fields, so the triggers to
    // recalculate scores have not fired. Therefore, explicitly update the scores now.

    updateScores();

    return result;
}


// Used to store the current CVSS Vector from the URL so that we can detect if the user changes it.
var CVSSVectorInURL;

function urlhash()
{
    var h = window.location.hash;
    CVSSVectorInURL = h;
    setMetricsFromVector(h.substring(1));   // The substring passes the Vector String without the leading '#'
}

function inputSelect()
{
    this.setSelectionRange(0, this.value.length);
}

/* When the page has fully loaded and is ready, perform the initial setup. This includes creating event handlers to
 * recalculate the score as the user changes metric values
 */

function cvssCalculator()
{
    if(!('CVSS31' in window) || !('CVSS31_Help' in window)) {
        setTimeout(cvssCalculator, 100);
        return;
    }

    var L,i,n;

    // Update the CVSS scores and Vector String whenever an input field is clicked
    L=document.querySelectorAll('.cvss-calculator input');
    i = L.length;
    while(i--) {
        bind(L[i], 'click', delayedUpdateScores);
    }

    // Add titles to every metric element containing help text. This is displayed when the user hovers over the
    // element.
    for(n in CVSS31_Help.helpText_en) {
        document.getElementById(n).setAttribute('title', CVSS31_Help.helpText_en[n]);
    }

    /* If a valid CVSS v3.1 Vector String is provided in the fragment of the URL (the part after the "#" symbol), set
     * the form fields to match the string. If the string is malformed or does not specify all the Base metrics, the
     * form fields default to the values they would assume if no string was passed, i.e. Base metrics are not set
     * and Temporal and Environmental metrics are all set to "X" (Not Defined).
     *
     * Record the initial CVSS Vector from the URL so that we can detect if the user changes it later.
     */
    urlhash();

    /* Create an anonymous function that is called if the Vector String in the fragment of the URL is modified after
     * the page is loaded to set the form fields to match the string. If the string is malformed or does not specify
     * all the Base metrics, no changes are made.
     */
    if (("onhashchange" in window)) {
      window.onhashchange = urlhash;
    }

    /* Create anonymous functions that are called when the Vector String displayed on the page is clicked. Both
     * select the entire Vector String to make it quicker to copy to the operating system's clipboard.
     */
    bind( bind("#vectorString", 'click', inputSelect), "contextmenu", inputSelect);

};  /* End of code called when page has fully loaded. */

cvssCalculator();
