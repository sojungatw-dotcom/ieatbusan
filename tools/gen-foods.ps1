param([string]$FoodsJson, [string]$I18nOutput, [string]$OutFile)
$ErrorActionPreference = 'Stop'
$ids = @('dwaeji-gukbap','milmyeon','ssiat-hotteok','nakgopsae','jagalchi-hoe','eomuk','haeundae-galbi','cheongsapo-jogae','naengchae-jokbal','gijang-daege','kkomjangeo','dongnae-pajeon','bokguk','bibim-dangmyeon','jobang-nakji','multteok','yubu-jumeoni','sogogi-gukbap','gijang-myeolchi','yeongdo-jeonbokjuk')
$likes = @(512,438,391,307,298,276,254,234,221,203,189,168,156,142,133,126,118,109,97,88)

function Decode($v) {
  if ($null -eq $v) { return $null }
  if ($v -is [string]) { return [System.Net.WebUtility]::HtmlDecode($v) }
  if ($v -is [System.Array]) { return ,@($v | ForEach-Object { Decode $_ }) }
  if ($v -is [System.Management.Automation.PSCustomObject]) {
    $o = [ordered]@{}
    foreach ($p in $v.PSObject.Properties) { $o[$p.Name] = Decode $p.Value }
    return $o
  }
  return $v
}

$ko = Get-Content -Raw -Encoding UTF8 $FoodsJson | ConvertFrom-Json
$tr = (Get-Content -Raw -Encoding UTF8 $I18nOutput | ConvertFrom-Json).result.foods
$out = @()
for ($i = 0; $i -lt 20; $i++) {
  $f = $ko[$i]
  $x = $tr | Where-Object { $_.index -eq $i } | Select-Object -First 1
  $file = [System.Uri]::UnescapeDataString(($f.photo.filePage -split 'File:')[1])
  $author = (($f.photo.author -replace '<[^>]+>', '') -replace '\s+', ' ').Trim()
  $places = @()
  for ($j = 0; $j -lt $f.restaurants.Count; $j++) {
    $c = if ($x -and $x.coords.Count -gt $j) { $x.coords[$j] } else { [pscustomobject]@{ lat = 35.155 + 0.01 * $j; lng = 129.06 } }
    $places += [ordered]@{ name = $f.restaurants[$j].name; lat = [double]$c.lat; lng = [double]$c.lng }
  }
  $entry = [ordered]@{
    id = $ids[$i]; likes = $likes[$i]
    credit = [ordered]@{ file = $file; author = $author; license = $f.photo.license; url = $f.photo.filePage }
    ko = [ordered]@{
      name = $f.name; gloss = ''; summary = $f.summary; category = $f.category; ingredients = $f.mainIngredients; taste = $f.taste
      price = $f.priceRange; calories = $f.calories; origin = $f.origin; steps = @($f.howToEat); tip = $f.tip
      allergens = @($f.allergens); allergenNote = $f.allergenNote
      restaurants = @($f.restaurants | ForEach-Object { [ordered]@{ area = $_.area; signature = $_.signature } })
    }
    places = $places
  }
  foreach ($l in 'en', 'zh', 'ja') { if ($x -and $x.$l) { $entry[$l] = Decode $x.$l } }
  $out += $entry
}
$json = $out | ConvertTo-Json -Depth 10
$header = "/* 부산 음식 20종 데이터 (KO 원문 + EN/ZH/JA 번역, 식당 좌표는 동 단위 근사치). 사진 출처는 credit 참고. */`n"
[System.IO.File]::WriteAllText($OutFile, $header + "window.FOODS = " + $json + ";`n", (New-Object System.Text.UTF8Encoding($false)))
"wrote $($out.Count) foods; translations: " + (($out | ForEach-Object { ($_.Keys | Where-Object { $_ -in 'en','zh','ja' }).Count }) -join ',')
