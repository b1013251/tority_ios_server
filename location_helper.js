//地球の半径
var R = 6371 * 1000;

//関数群
var is_in_a_range = function(viewLat , viewLon , posLat , posLon , range) {
    return distance(viewLat , viewLon , posLat , posLon) < range;
}

var distance = function(viewLat , viewLon , posLat , posLon) {
    var radViewLat = viewLat * Math.PI / 180.0;
    var radViewLon = viewLon * Math.PI / 180.0;
    var radPosLat  = posLat  * Math.PI / 180.0;
    var radPosLon  = posLon  * Math.PI / 180.0;
    return Math.acos( Math.sin(radViewLon) * Math.sin(radPosLon) +
                      Math.cos(radViewLon) * Math.cos(radPosLon) *
                      Math.cos(radPosLat - radViewLat)) * R;
    //比較できればいいので半径いれてない
}


//エクスポート
exports.is_in_a_range = is_in_a_range;
