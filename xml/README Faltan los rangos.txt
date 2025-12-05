Cambios: CAMBIAR DTD Y GENENRAR OTRA VEZ EL SVG
	Tipos:
		Extensión: xml:string --> xml:int 
		Anchura: xml:string --> xml:int 
		Fecha: xml:string --> xml:date 
		Vueltas: xml:string --> xml:int 
		
		
		Sector: xml:string --> xml:int 
		
		Podio:
			Posicion: xml:string --> xml:int 
			Puntos: xml:string --> xml:int 

	Rangos:
		<!-- Nuevos tipos restringidos para coordenadas y altitud -->
  <xs:simpleType name="longitudeType">
    <xs:restriction base="xs:decimal">
      <xs:minInclusive value="-180"/>
      <xs:maxInclusive value="180"/>
      <xs:fractionDigits value="6"/>
    </xs:restriction>
  </xs:simpleType>

  <xs:simpleType name="latitudeType">
    <xs:restriction base="xs:decimal">
      <xs:minInclusive value="-90"/>
      <xs:maxInclusive value="90"/>
      <xs:fractionDigits value="6"/>
    </xs:restriction>
  </xs:simpleType>

  <xs:simpleType name="altitudeType">
    <xs:restriction base="xs:decimal">
      <xs:minInclusive value="0"/>
      <xs:maxInclusive value="10000"/> 
      <xs:fractionDigits value="2"/>
    </xs:restriction>
  </xs:simpleType>
  <!--Fin de tipos restringidos-->