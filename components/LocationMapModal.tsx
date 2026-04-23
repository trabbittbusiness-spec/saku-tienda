import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, TextInput, Pressable, Modal, ScrollView } from 'react-native';
import { MapPin, Search, X, Minus, Plus, Home, Briefcase, Navigation, Dog as DogIcon } from 'lucide-react-native';

interface LocationMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (location: any) => void;
}

export default function LocationMapModal({ isOpen, onClose, onSave }: LocationMapModalProps) {
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= 768;
  const mapRef = React.useRef<any>(null);
  const [selectedCategory, setSelectedCategory] = useState('CASA');
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState({
    main: 'Nueva Providencia 1515',
    sub: 'Providencia, RM',
    lat: -33.4425,
    lng: -70.6400
  });
  const [mapCenter, setMapCenter] = useState({ lat: -33.4425, lng: -70.6400 });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleMessage = async (e: any) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'map_moved') {
          const { lat, lng } = data;
          
          const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyCQH4lTH-ORvtHo2gnBEn9lkndlG2j1yjg&language=es`;
          const geoProxyUrl = `https://corsproxy.io/?${encodeURIComponent(geoUrl)}`;
          const res = await fetch(geoProxyUrl);
          const geoData = await res.json();
          
          if (geoData.results && geoData.results.length > 0) {
            const result = geoData.results[0];
            const addressParts = result.formatted_address.split(',');
            
            const streetNumber = result.address_components.find((c: any) => c.types.includes('street_number'))?.long_name;
            const route = result.address_components.find((c: any) => c.types.includes('route'))?.long_name;
            
            setSelectedLocation({
              main: (route && streetNumber) ? `${route} ${streetNumber}` : (addressParts[0] || 'Ubicación seleccionada'),
              sub: addressParts.slice(1, 3).map(s => s.trim()).join(', ') || '',
              lat: lat,
              lng: lng
            });
          }
        }
      } catch (err) {}
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const googleMapsHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { padding: 0; margin: 0; background: #E5E7EB; }
            #map { width: 100%; height: 100vh; }
            .gm-style-cc { display: none !important; }
            button[title="Stop centering map"] { display: none !important; }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            function initMap() {
                var map = new google.maps.Map(document.getElementById('map'), {
                    center: {lat: ${mapCenter.lat}, lng: ${mapCenter.lng}},
                    zoom: 17,
                    disableDefaultUI: true,
                    styles: [
                        {
                            "featureType": "poi",
                            "elementType": "labels",
                            "stylers": [{ "visibility": "off" }]
                        }
                    ]
                });

                var marker = new google.maps.Marker({
                    position: {lat: ${mapCenter.lat}, lng: ${mapCenter.lng}},
                    map: map,
                    draggable: true,
                    icon: {
                        path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                        fillColor: '#EF4444',
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: '#FFFFFF',
                        scale: 2,
                        anchor: new google.maps.Point(12, 22)
                    }
                });

                map.addListener('click', function(e) {
                    var pos = e.latLng;
                    marker.setPosition(pos);
                    window.parent.postMessage(JSON.stringify({ 
                        type: 'map_moved', 
                        lat: pos.lat(), 
                        lng: pos.lng() 
                    }), '*');
                });

                marker.addListener('dragend', function() {
                    var pos = marker.getPosition();
                    window.parent.postMessage(JSON.stringify({ 
                        type: 'map_moved', 
                        lat: pos.lat(), 
                        lng: pos.lng() 
                    }), '*');
                });

                window.addEventListener('message', function(e) {
                  try {
                    var data = JSON.parse(e.data);
                    if (data.type === 'set_center') {
                      var pos = {lat: data.lat, lng: data.lng};
                      map.setCenter(pos);
                      map.setZoom(17);
                      marker.setPosition(pos);
                      
                      window.parent.postMessage(JSON.stringify({ 
                        type: 'map_moved', 
                        lat: pos.lat, 
                        lng: pos.lng 
                      }), '*');
                    }
                    if (data.type === 'zoom_in') {
                      map.setZoom(map.getZoom() + 1);
                    }
                    if (data.type === 'zoom_out') {
                      map.setZoom(map.getZoom() - 1);
                    }
                  } catch(err) {}
                });
            }
        </script>
        <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCQH4lTH-ORvtHo2gnBEn9lkndlG2j1yjg&callback=initMap&language=es" async defer></script>
    </body>
    </html>
  `;

  if (!isOpen) return null;

  return (
    <View style={{ position: 'fixed' as any, top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(10px)' }}>
      <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={onClose} />
      
      <View style={{
        width: isDesktop ? 1000 : '95%', 
        height: isDesktop ? 520 : '90%', 
        backgroundColor: '#FFFFFF', borderRadius: isDesktop ? 48 : 32,
        flexDirection: isDesktop ? 'row' : 'column', 
        alignItems: 'center', padding: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 25 }, shadowOpacity: 0.2, shadowRadius: 60,
        borderWidth: 1, borderColor: '#F3F4F6'
      }}>
        
        {/* MAP SECTION */}
        <View style={{ 
          width: isDesktop ? 496 : '100%', 
          height: isDesktop ? 496 : 320, 
          borderRadius: isDesktop ? 40 : 24, 
          overflow: 'hidden', 
          position: 'relative', backgroundColor: '#E5E7EB',
          justifyContent: 'center', alignItems: 'center'
        }}>
          <iframe
            ref={mapRef}
            srcDoc={googleMapsHtml}
            style={{ width: '100%', height: '100%', border: 'none', position: 'absolute', top: 0, left: 0 } as any}
            allowFullScreen={false}
            loading="lazy"
            title="Interactive Map"
          />

          {/* Custom Zoom Controls */}
          <View style={{ 
            position: 'absolute' as any, bottom: isDesktop ? 92 : 80, right: 16, 
            gap: 8, alignItems: 'center'
          }}>
            <TouchableOpacity 
              onPress={() => mapRef.current?.contentWindow.postMessage(JSON.stringify({ type: 'zoom_in' }), '*')}
              style={{
                width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF',
                justifyContent: 'center', alignItems: 'center',
                shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8,
              }}
            >
              <Plus size={20} color="#1F2937" strokeWidth={3} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => mapRef.current?.contentWindow.postMessage(JSON.stringify({ type: 'zoom_out' }), '*')}
              style={{
                width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF',
                justifyContent: 'center', alignItems: 'center',
                shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8,
              }}
            >
              <Minus size={20} color="#1F2937" strokeWidth={3} />
            </TouchableOpacity>
          </View>

          {/* Minimal Light GPS Button */}
          <TouchableOpacity 
            onPress={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    const { latitude, longitude } = position.coords;
                    if (mapRef.current) {
                      mapRef.current.contentWindow.postMessage(JSON.stringify({ type: 'set_center', lat: latitude, lng: longitude }), '*');
                    }
                  },
                  (error) => console.log('Geolocation error:', error),
                  { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
                );
              }
            }}
            style={{
              position: 'absolute' as any, bottom: 20, right: 16,
              width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFFFFF',
              justifyContent: 'center', alignItems: 'center',
              shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12,
            }}
          >
            <Navigation size={22} color="#3B82F6" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* INFO SECTION */}
        <View style={{ flex: 1, paddingHorizontal: isDesktop ? 40 : 16, paddingVertical: isDesktop ? 20 : 16, width: '100%', justifyContent: 'space-between', zIndex: 50 }}>
          
          <View style={{ zIndex: 100 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: isDesktop ? 24 : 16 }}>
              <Text style={{ fontSize: isDesktop ? 14 : 11, fontWeight: '800', color: '#111827', letterSpacing: 2, textTransform: 'uppercase' }}>Fijar Destino</Text>
              <TouchableOpacity onPress={onClose} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }}>
                <X size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Light Search Bar Container - OVERLAYS EVERYTHING BELOW */}
            <View style={{ position: 'relative', zIndex: 9999, marginBottom: isDesktop ? 24 : 16 }}>
              <View style={{
                flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB',
                borderRadius: 20, paddingHorizontal: 16, height: isDesktop ? 64 : 56, borderWidth: 1, borderColor: '#E5E7EB',
              }}>
                <Search size={20} color="#9CA3AF" strokeWidth={2} />
                <TextInput
                  placeholder="Busca una dirección..."
                  placeholderTextColor="#9CA3AF"
                  value={mapSearchQuery}
                  onChangeText={async (text) => {
                    setMapSearchQuery(text);
                    setShowAutocomplete(text.length > 0);
                    
                    if (text.length > 2) {
                      try {
                        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=AIzaSyCQH4lTH-ORvtHo2gnBEn9lkndlG2j1yjg`;
                        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                        const res = await fetch(proxyUrl);
                        const data = await res.json();
                        if (data.predictions) {
                          setSearchResults(data.predictions);
                        }
                      } catch (e) {
                        console.log('Error fetching places:', e);
                      }
                    } else {
                      setSearchResults([]);
                    }
                  }}
                  onFocus={() => setShowAutocomplete(mapSearchQuery.length > 0)}
                  style={{ flex: 1, marginLeft: 12, fontSize: isDesktop ? 16 : 14, fontWeight: '600', color: '#111827', outlineStyle: 'none' as any }}
                />
                {mapSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => { setMapSearchQuery(''); setShowAutocomplete(false); setSearchResults([]); }}>
                    <X size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Autocomplete Dropdown */}
              {showAutocomplete && (
                <View style={{
                  position: 'absolute' as any, top: isDesktop ? 72 : 64, left: 0, right: 0,
                  backgroundColor: '#FFFFFF', borderRadius: 20, paddingVertical: 8,
                  shadowColor: '#000', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.2, shadowRadius: 40, elevation: 50,
                  borderWidth: 1, borderColor: '#E5E7EB',
                  maxHeight: isDesktop ? 320 : 380, overflow: 'hidden',
                  zIndex: 99999
                }}>
                  <ScrollView keyboardShouldPersistTaps="handled">
                    {searchResults.length > 0 ? searchResults.map((place, idx) => {
                      const mainText = place.structured_formatting?.main_text || place.description;
                      const subText = place.structured_formatting?.secondary_text || '';
                      
                      return (
                        <TouchableOpacity
                          key={place.place_id || idx}
                          onPress={async () => {
                            setMapSearchQuery(place.description);
                            setShowAutocomplete(false);
                            
                            setSelectedLocation(prev => ({
                              ...prev,
                              main: mainText,
                              sub: subText || place.description
                            }));
                            
                            try {
                              const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(place.description)}&key=AIzaSyCQH4lTH-ORvtHo2gnBEn9lkndlG2j1yjg&language=es`;
                              const geoProxyUrl = `https://corsproxy.io/?${encodeURIComponent(geoUrl)}`;
                              const res = await fetch(geoProxyUrl);
                              const data = await res.json();
                              
                              if (data.results && data.results.length > 0) {
                                const { lat, lng } = data.results[0].geometry.location;
                                if (mapRef.current) {
                                  mapRef.current.contentWindow.postMessage(JSON.stringify({ type: 'set_center', lat, lng }), '*');
                                }
                                setSelectedLocation({
                                  main: mainText,
                                  sub: subText || place.description,
                                  lat: lat,
                                  lng: lng
                                });
                              }
                            } catch (error) {
                              console.log('Error fetching geocoding:', error);
                            }
                          }}
                          style={{
                            flexDirection: 'row', alignItems: 'center', gap: 12,
                            paddingVertical: 12, paddingHorizontal: 16,
                            borderBottomWidth: idx !== searchResults.length - 1 ? 1 : 0, borderBottomColor: '#F3F4F6'
                          }}
                        >
                          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }}>
                            <MapPin size={16} color="#6B7280" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }} numberOfLines={1}>{mainText}</Text>
                            {subText ? <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 1, fontWeight: '500' }} numberOfLines={1}>{subText}</Text> : null}
                          </View>
                        </TouchableOpacity>
                      )
                    }) : (
                      <View style={{ padding: 16, alignItems: 'center' }}>
                        <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500' }}>
                          {mapSearchQuery.length > 2 ? 'Buscando lugares...' : 'Escribe para buscar...'}
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} bounces={false} style={{ flex: 1 }}>
            <View>
              {/* Detected Location */}
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: isDesktop ? 32 : 24 }}>
                <View style={{ width: 4, height: isDesktop ? 50 : 40, backgroundColor: '#F47321', borderRadius: 4 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: isDesktop ? 26 : 20, fontWeight: '800', color: '#111827', letterSpacing: -0.5 }} numberOfLines={1}>{selectedLocation.main}</Text>
                  <Text style={{ fontSize: isDesktop ? 15 : 13, color: '#6B7280', fontWeight: '600', marginTop: 2 }} numberOfLines={1}>{selectedLocation.sub}</Text>
                </View>
              </View>

              {/* Type Toggles (Light Style) */}
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: isDesktop ? 0 : 20 }}>
                {[
                  { label: 'CASA', icon: Home },
                  { label: 'TRABAJO', icon: Briefcase },
                  { label: 'VET', icon: DogIcon },
                ].map((cat) => {
                  const isActive = selectedCategory === cat.label;
                  return (
                    <Pressable
                      key={cat.label}
                      onPress={() => setSelectedCategory(cat.label)}
                      style={{
                        flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6,
                        paddingVertical: isDesktop ? 16 : 12, borderRadius: 16,
                        backgroundColor: isActive ? '#FFF7ED' : '#F9FAFB',
                        borderWidth: 1.5, borderColor: isActive ? '#F47321' : '#F3F4F6',
                      }}
                    >
                      <cat.icon size={isDesktop ? 20 : 18} color={isActive ? '#F47321' : '#9CA3AF'} strokeWidth={isActive ? 2.5 : 2} />
                      <Text style={{ fontSize: isDesktop ? 12 : 10, fontWeight: '800', color: isActive ? '#F47321' : '#6B7280', letterSpacing: 0.5 }}>{cat.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Green CTA */}
          <TouchableOpacity
            onPress={() => {
              if (onSave) onSave({ ...selectedLocation, category: selectedCategory });
              onClose();
            }}
            style={{
              backgroundColor: '#10B981', borderRadius: 20, paddingVertical: isDesktop ? 20 : 16,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
              shadowColor: '#10B981', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 20,
              marginTop: isDesktop ? 24 : 12
            }}
          >
            <MapPin size={22} color="#FFFFFF" strokeWidth={3} />
            <Text style={{ color: '#FFFFFF', fontSize: isDesktop ? 16 : 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>Guardar Ruta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
