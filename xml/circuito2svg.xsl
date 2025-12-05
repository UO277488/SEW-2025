<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:c="http://www.uniovi.es"
    exclude-result-prefixes="c">

  <!-- Transform the circuito XML (namespace http://www.uniovi.es) into a simple SVG
       Uses the origin coordinates from /circuito/origen as reference and scales
       deltas to produce visible positions. -->

  <xsl:output method="xml" indent="yes" />

  <xsl:param name="scale" select="20000"/>
  <xsl:template match="/">
    <xsl:apply-templates select="c:circuito"/>
  </xsl:template>

  <xsl:template match="c:circuito">
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600" version="1.1">
      <rect width="100%" height="100%" fill="#ffffff"/>
      <g id="track" transform="translate(50,50)">
        <xsl:variable name="originLon" select="number(c:origen/c:coordenada/c:longitud)"/>
        <xsl:variable name="originLat" select="number(c:origen/c:coordenada/c:latitud)"/>

        <!-- Polyline with all tramo points -->
        <polyline fill="none" stroke="#d9534f" stroke-width="2">
          <xsl:attribute name="points">
            <xsl:for-each select="c:tramos/c:tramo">
              <xsl:variable name="lon" select="number(.//c:longitud)"/>
              <xsl:variable name="lat" select="number(.//c:latitud)"/>
              <xsl:variable name="x" select="format-number((($lon - $originLon) * $scale),'0.##')"/>
              <xsl:variable name="y" select="format-number((($originLat - $lat) * $scale),'0.##')"/>
              <xsl:value-of select="concat($x,',',$y)"/>
              <xsl:if test="position() != last()"> <xsl:text> </xsl:text> </xsl:if>
            </xsl:for-each>
          </xsl:attribute>
        </polyline>

        <!-- Draw circles and labels for each point -->
        <xsl:for-each select="c:tramos/c:tramo">
          <xsl:variable name="lon" select="number(.//c:longitud)"/>
          <xsl:variable name="lat" select="number(.//c:latitud)"/>
          <xsl:variable name="x" select="format-number((($lon - $originLon) * $scale),'0.##')"/>
          <xsl:variable name="y" select="format-number((($originLat - $lat) * $scale),'0.##')"/>
          <circle cx="{@x}" cy="{@y}" r="3" fill="#337ab7">
            <xsl:attribute name="cx"><xsl:value-of select="$x"/></xsl:attribute>
            <xsl:attribute name="cy"><xsl:value-of select="$y"/></xsl:attribute>
          </circle>
          <text font-size="10" fill="#222">
            <xsl:attribute name="x"><xsl:value-of select="$x"/></xsl:attribute>
            <xsl:attribute name="y"><xsl:value-of select="concat($y - 6)"/></xsl:attribute>
            <xsl:value-of select="c:sector"/>
          </text>
        </xsl:for-each>
      </g>
      <!-- Title -->
      <text x="60" y="25" font-size="16" font-family="Arial" fill="#000">
        <xsl:value-of select="c:nombreCircuito"/>
      </text>
    </svg>
  </xsl:template>

</xsl:stylesheet>
