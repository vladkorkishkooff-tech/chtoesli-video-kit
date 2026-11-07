@tool
class_name Fonts
extends RefCounted
## Шрифты «Света»: заголовки — PT Serif Bold, подписи — рукописный Caveat (оба OFL, см. fonts/).

const SERIF_BOLD := preload("res://fonts/PT_Serif-Web-Bold.ttf")
const SERIF := preload("res://fonts/PT_Serif-Web-Regular.ttf")
const SERIF_ITALIC := preload("res://fonts/PT_Serif-Web-Italic.ttf")
const CAVEAT := preload("res://fonts/Caveat-Variable.ttf")

static var _hand: FontVariation


## Рукописный, чуть жирнее обычного.
static func hand() -> Font:
	if _hand == null:
		_hand = FontVariation.new()
		_hand.base_font = CAVEAT
		_hand.variation_opentype = {"wght": 600}
	return _hand
