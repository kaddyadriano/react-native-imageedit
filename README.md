# React Native ImageEdit

This React Native component `ImageEdit` allows you to edit images inline for cropping. This component will provide you all the measurements you need for cropping so you can finish up with the cropping from a server or from other sources.

## Installation

```
npm install react-native-imageedit --save
```

## Demo
![Demo Animation](docs/animation.gif)
## Simple Usage

```
import ImageEdit from 'react-native-imageedit'
```
```
<ImageEdit
  image="https://source.unsplash.com/daily" //Image uri
  onSave={info => console.log(info)}
/>

//OR

<ImageEdit
  width={400} //Crop area width
  height={300} //Crop area height
  image={{
          uri :"https://source.unsplash.com/daily", 
          width: 1000, 
          height: 500
          }}
  onSave={info => console.log(info)}
/>

//OR for custom buttons

<ImageEdit
    showEditButton={false}
    showSaveButtons={false}
    image="https://source.unsplash.com/daily" //Image uri
    ref={ref=>this._imageEdit = ref}
>
    <TouchableOpacity onPress={()=> console.log(this._imageEdit.getInfo())}>
        <Text>Custom Button</Text>
    </TouchableOpacity>
</ImageEdit>

```

## Props

|Prop|Type|Description|
|----|----|-----------|
|width|Number|Crop area width. Default: window width|
|height|Number|Crop area height. Default: window width|
|image|Object, String|Image object or uri string. Required|
|editing|Bool|Editing mode. Default: false|
|cropIn|Bool|Allow to crop smaller that the crop area. Default: false|
|showEditButton|Bool|Show edit button. Default: true|
|showSaveButtons|Bool|Show save buttons. Default: true|
|showGrids|Bool|Show grids while editing. Default: true|
|containerStyle|Object|Component container style|
|areaStyle|Object|Crop area container style|
|gridStyle|Object|Grid line style|
|gridColor|Object|Grid line color|
|buttonsColor|String|Buttons color|
|onEdit|Func|Edit button onPress callback|
|onSave|Func|Save button onPress callback. Will pass cropping info object as argument|
|onCancel|Func|Cancel button onPress callback|

## Methods

|Method|Description|
|------|-----------|
|enable()|Switch to editing mode|
|disable()|Disable editing mode|
|getInfo()|Returns cropping info object|

## Cropping Info Object

```
{
    area: {
        width: 500,
        height: 400
    },
    image: {
        uri: "https://source.unsplash.com/daily",
        width: 800,
        height: 650,
        x: -100,
        y: -55
    }
}

```
You will send this data to crop your image.
