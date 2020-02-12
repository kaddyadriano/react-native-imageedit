import React, { Component } from "react";
import {
  StyleSheet,
  View,
  Dimensions,
  Image,
  PanResponder,
  ViewPropTypes,
  TouchableOpacity,
  Text
} from "react-native";
import { Icon } from "react-native-elements";
import resolveAssetSource from "react-native/Libraries/Image/resolveAssetSource";
import PropTypes from "prop-types";
import Video from 'react-native-video';

const window = Dimensions.get("window");
const WW = window.width;
const WH = window.height;

export default class ImageEdit extends Component {
  static propTypes = {
    image: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
    width: PropTypes.number,
    height: PropTypes.number,
    scaled: PropTypes.bool,
    editing: PropTypes.bool,
    showEditButton: PropTypes.bool,
    showSaveButtons: PropTypes.bool,
    showGrids: PropTypes.bool,
    cropIn: PropTypes.bool,
    containerStyle: ViewPropTypes.style,
    areaStyle: ViewPropTypes.style,
    gridStyle: ViewPropTypes.style,
    backgroundColor: PropTypes.string,
    gridColor: PropTypes.string,
    buttonsColor: PropTypes.string,
    onEdit: PropTypes.func,
    onSave: PropTypes.func,
    onCancel: PropTypes.func,
    saveButtonText: PropTypes.string,
    cancelButtonText: PropTypes.string,
    resizeMode: PropTypes.string
  };

  static defaultProps = {
    image: "",
    width: WW,
    height: WW,
    scaled: false,
    editing: false,
    showEditButton: true,
    showSaveButtons: true,
    showGrids: true,
    cropIn: false,
    containerStyle: {},
    areaStyle: {},
    gridStyle: {},
    backgroundColor: this.defaultColor,
    gridColor: this.defaultColor,
    buttonsColor: this.defaultColor,
    saveButtonText: "Save",
    cancelButtonText: "Cancel",
    resizeMode: "stretch"
  };

  static imageDefaults = {
    type: 'image',
    uri: null,
    width: 0,
    height: 0,
    x: 0,
    y: 0
  };

  constructor(props) {
    super(props);

    this.state = {
      width: this.props.width,
      height: this.props.height,
      scaled: this.props.scaled,
      image: ImageEdit.imageDefaults,
      cropIn: this.props.cropIn,
      editing: this.props.editing,
      editingProp: this.props.editing,
      isPinching: false,
      isMoving: false,
      resizeMode: this.props.resizeMode
    };

    this.defaultColor = "#C1272D";
    this.image = null;
    this.initW = 0;
    this.initH = 0;
    this.initX = 0;
    this.initY = 0;
    this.initDistance = 0;
    this._panResponder = null;
    this._panBlockNative = this.state.editing;
  }

  getPanResponder(){
    if(this._panBlockNative != this.state.editing || !this._panResponder){
      this._panResponder = PanResponder.create({
        onStartShouldSetPanResponder: (evt, gestureState) => true,
        onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
        onMoveShouldSetPanResponder: (evt, gestureState) => true,
        onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
        onPanResponderGrant: (evt, gestureState) => {},
        onPanResponderMove: this.onMove.bind(this),
        onPanResponderTerminationRequest: (evt, gestureState) => true,
        onPanResponderRelease: this.onRelease.bind(this),
        onPanResponderTerminate: this.onRelease.bind(this),
        onShouldBlockNativeResponder: (evt, gestureState) => {
          return this.state.editing;
        }
      });
      this._panBlockNative = this.state.editing;
    }
    return this._panResponder;
  }

  getInfo() {
    return {
      area: {
        width: this.state.width,
        height: this.state.height
      },
      image: this.state.image
    };
  }

  componentDidUpdate(){
    this.fixImageSize();
  }

  fixImageSize(){
    if(this.state.image.uri && !this.state.image.width){
      let uri = this.state.image.uri;
      if(/^http/i.test(uri) || /^file:/.test(uri)){
        Image.getSize(
            uri,
            (w, h) => {
              let sd = ImageEdit.scaledDimensions({width: this.state.width, height: this.state.height}, {width: w, height: h});
              this.setState({image: { ...this.state.image, width: sd.width, height: sd.height }});
            },
            () => {}
        );
      }
    }
  }

  static changed(props, state) {
    let image =
        typeof props.image == "object" ? props.image : { uri: props.image };
    return (
        props.width != state.width ||
        props.height != state.height ||
        state.image.uri != image.uri ||
        props.editing != state.editingProp ||
        props.cropIn != state.cropIn ||
        props.scaled != state.scaled ||
        props.resizeMode != state.resizeMode
    );
  }

  static getDerivedStateFromProps(props, state) {
    let changed = ImageEdit.changed(props, state);
    if (changed)
      return ImageEdit._build(props, state) || null;

    return null;
  }

  static scaledDimensions(area, dim){
    let width = dim.width || 0,
        height = dim.height || 0;

    //Scale image size to the area
    let new_iw = area.width;
    let new_ih = (new_iw * height) / width;
    if (new_ih < area.height) {
      new_ih = area.height;
      new_iw = (new_ih * width) / height;
    }

    return {
      width: new_iw,
      height: new_ih
    }
  }

  static _build(props, state) {
    let info = {},
        w = props.width || WW,
        h = props.height || WW,
        image = typeof props.image == "object" ? props.image : (props.image ? { ...ImageEdit.imageDefaults, uri: props.image} : null);

    if (typeof props.width != 'undefined' || !state.image.width) info.width = w;
    if (typeof props.height != 'undefined' || !state.image.height) info.height = h;

    if (typeof props.editing != 'undefined') {
      info.editing = props.editing;
      info.editingProp = props.editing;
    }

    if (typeof props.cropIn != 'undefined') info.cropIn = props.cropIn;
    if (typeof props.scaled != 'undefined') info.scaled = props.scaled;
    else info.scaled = state.scaled;
    if (typeof props.resizeMode != 'undefined') info.resizeMode = props.resizeMode;
    else info.resizeMode = state.resizeMode;

    if (image && image.uri != state.image.uri){
      image.x = image.x || 0;
      image.y = image.y || 0;
      let hasDimensions = true;
      if(!image.width && !image.height){
        hasDimensions = false;
        if(ImageEdit.isNumeric(image.uri)){
          let s = resolveAssetSource(image.uri);
          if(s) image = {...image, ...s};
        } else {
          let size = resolveAssetSource({ uri: image.uri });
          if (size.width && size.height){
            image.width = size.width;
            image.height = size.height;
          }
        }

      }

      let ext = (image.path ? image.path : image.uri).toLowerCase().split('.');
      ext = ext[ext.length-1];
      let type = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "heic"].includes(ext) || (image.mime && /image/.test(image.mime)) ? 'image' : 'video';
      image.type = type;

      if(image.width && image.height && (!info.scaled || (info.scaled && !hasDimensions) || (!info.scaled && info.resizeMode === "contain"))){
        let sd = ImageEdit.scaledDimensions({width: w, height: h}, {width: image.width, height: image.height});
        image.width = sd.width;
        image.height = sd.height;
      }

      info.image = image;
    }
    return info;

  }

  static isNumeric(n){
    return !isNaN(n) && isFinite(n);
  }

  enable() {
    this.setState({ editing: true });
  }

  disable() {
    this.setState({ editing: false });
  }

  onEdit() {
    this.setState({ editing: true });
    if (this.props.onEdit) this.props.onEdit();
  }

  onCancel() {
    this.setState({ editing: false });
    if (this.props.onCancel) this.props.onCancel();
  }

  onSave() {
    this.setState({ editing: false });
    let info = this.getInfo();
    if (this.props.onSave) this.props.onSave(info);
  }

  onRelease(e) {
    if (!this.state.editing) return;
    this.setState({ isPinching: false, isMoving: false });
    this.distance = 0;
  }

  onMove(e, gestureState) {
    e.persist();
    if (!this.state.editing) return;

    //Pinching
    if (e.nativeEvent.touches.length == 2) {
      let x1 = e.nativeEvent.touches[0].locationX;
      let y1 = e.nativeEvent.touches[0].locationY;
      let x2 = e.nativeEvent.touches[1].locationX;
      let y2 = e.nativeEvent.touches[1].locationY;
      let a = x1 - x2;
      let b = y1 - y2;
      let dist = Math.sqrt(a * a + b * b);

      let info = {};

      if (this.state.isPinching) {
        this.distance = dist - this.initDistance;
        info.image = {
          ...this.state.image,
          width: this.initW + this.distance,
          height: this.initH + this.distance
        };

        if (!this.state.cropIn) {
          //Keep the image size >= to crop area
          let new_iw = info.image.width,
              new_ih = info.image.height;
          if (this.state.width > info.image.width) {
            new_iw = this.state.width;
            new_ih = (new_iw * this.initH) / this.initW;
          }

          if (this.state.height > new_ih) {
            new_ih = this.state.height;
            new_iw = (new_ih * this.initW) / this.initH;
          }

          info.image.width = new_iw;
          info.image.height = new_ih;

          //position
          let x = this.state.image.x;
          let y = this.state.image.y;
          let maxx = -1 * Math.abs(info.image.width - this.state.width),
              maxy = -1 * Math.abs(info.image.width - this.state.height);

          if (x < maxx) x = maxx;
          if (x > 0) x = 0;
          if (y < maxy) y = maxy;
          if (y > 0) y = 0;
          info.image.x = x;
          info.image.y = y;
        }
      } else {
        this.initW = this.state.image.width;
        this.initH = this.state.image.height;
        this.initDistance = dist;
        info.isPinching = true;
      }

      this.setState(info);
    } else if (e.nativeEvent.touches.length == 1) {
      //Moving
      if (this.state.isMoving) {
        let x = this.initX + gestureState.dx,
            y = this.initY + gestureState.dy;

        if (!this.state.cropIn) {
          let maxx = -1 * Math.abs(this.state.image.width - this.state.width),
              maxy = -1 * Math.abs(this.state.image.height - this.state.height);

          if (x < maxx) x = maxx;
          if (x > 0) x = 0;
          if (y < maxy) y = maxy;
          if (y > 0) y = 0;
        }

        this.setState({
          image: {
            ...this.state.image,
            x: x,
            y: y
          }
        });
      } else {
        this.initX = this.state.image.x;
        this.initY = this.state.image.y;
        this.setState({ isMoving: true });
      }
    }
  }

  //Render Image
  renderImage() {
    if (this.state.image.uri){
      let uri = this.state.image.path ? this.state.image.path : this.state.image.uri;
      let style = {
        width: this.state.image.width,
        height: this.state.image.height,
        top: this.state.image.y,
        left: this.state.image.x
      };

      switch(this.state.image.type){
        case 'image':
          return (
              <Image
                  ref={ref => (this.image = ref)}
                  style={style}
                  source={{ uri: uri }}
                  resizeMode={this.state.resizeMode}
              />
          );
          break;
        case 'video':
          return (
              <Video
                  ref={(ref) => this.image = ref}
                  source={{ uri: uri }}
                  resizeMode={this.state.resizeMode}
                  paused={false}
                  fullscreen={false}
                  controls={false}
                  muted={true}
                  repeat={true}
                  style={style}
              />
          )
          break;
      }

    }
  }

  renderGrids() {
    if (!this.props.showGrids) return;
    return [
      <View
          key="gl1"
          style={[
            styles.gridLine,
            styles.gl1,
            {
              position: !this.state.editing ? "relative" : "absolute",
              display: !this.state.editing ? "none" : "flex"
            },
            {
              borderColor: this.props.gridColor
                  ? this.props.gridColor
                  : this.defaultColor
            },
            this.props.gridStyle
          ]}
      />,
      <View
          key="gl2"
          style={[
            styles.gridLine,
            styles.gl2,
            {
              position: !this.state.editing ? "relative" : "absolute",
              display: !this.state.editing ? "none" : "flex"
            },
            {
              borderColor: this.props.gridColor
                  ? this.props.gridColor
                  : this.defaultColor
            },
            this.props.gridStyle
          ]}
      />,
      <View
          key="gl3"
          style={[
            styles.gridLine,
            styles.gl3,
            {
              position: !this.state.editing ? "relative" : "absolute",
              display: !this.state.editing ? "none" : "flex"
            },
            {
              borderColor: this.props.gridColor
                  ? this.props.gridColor
                  : this.defaultColor
            },
            this.props.gridStyle
          ]}
      />,
      <View
          key="gl4"
          style={[
            styles.gridLine,
            styles.gl4,
            {
              position: !this.state.editing ? "relative" : "absolute",
              display: !this.state.editing ? "none" : "flex"
            },
            {
              borderColor: this.props.gridColor
                  ? this.props.gridColor
                  : this.defaultColor
            },
            this.props.gridStyle
          ]}
      />
    ];
  }

  renderButtons() {
    let buttons = [];
    if (!this.state.editing && this.props.showEditButton) {
      buttons.push(
          <TouchableOpacity
              key="editbtn"
              style={[
                styles.editButton,
                {
                  top: 10,
                  display: this.state.editing ? "none" : "flex",
                  position: this.state.editing ? "relative" : "absolute"
                }
              ]}
              onPress={this.onEdit.bind(this)}
          >
            <Icon
                reverse
                size={20}
                name="crop"
                color={
                  this.props.buttonsColor
                      ? this.props.buttonsColor
                      : this.defaultColor
                }
            />
          </TouchableOpacity>
      );
    } else if (this.state.editing && this.props.showSaveButtons) {
      buttons.push(
          <View key="buttonbtns" style={styles.buttonsWrap}>
            <TouchableOpacity
                style={[styles.cancelButton]}
                onPress={this.onCancel.bind(this)}
            >
              <Text style={styles.buttonText}>{this.props.cancelButtonText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[
                  styles.saveButton,
                  {
                    backgroundColor: this.props.buttonsColor
                        ? this.props.buttonsColor
                        : this.defaultColor
                  }
                ]}
                onPress={this.onSave.bind(this)}
            >
              <Text style={styles.buttonText}>{this.props.saveButtonText}</Text>
            </TouchableOpacity>
          </View>
      );
    }

    return buttons;
  }

  //Render component children
  renderChildren() {
    if (this.props.children) {
      return (
        <View
          style={[
            styles.children,
            this.state.editing && this.props.showSaveButtons
              ? { bottom: 50 }
              : null
          ]}
        >
          {this.props.children}
        </View>
      );
    }
    return null;
  }

  render() {
    let pr = this.getPanResponder();
    return (
        <View style={[styles.wrapper, this.props.containerStyle]}>
          <View
              {...pr.panHandlers}
              style={[
                styles.cropArea,
                {
                  width: this.state.width,
                  height: this.state.height,
                  borderBottomWidth: !this.state.editing ? 0 : 0
                },
                {
                  backgroundColor: this.props.backgroundColor
                      ? this.props.backgroundColor
                      : this.defaultColor
                },
                this.props.areaStyle
              ]}
          >
            {this.renderImage()}
            {this.renderGrids()}
          </View>
          {this.renderChildren()}
          {this.renderButtons()}
        </View>
    );
  }
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative"
  },
  cropArea: {
    backgroundColor: "#000000",
    borderBottomWidth: 1,
    borderColor: "#000000",
    borderStyle: "solid",
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    overflow: "hidden"
  },
  grid: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100
  },
  gridLine: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.5)",
    borderStyle: "solid",
    position: "absolute",
    width: "100%",
    height: 0.5,
    zIndex: 100
  },
  gl1: {
    top: "25%"
  },
  gl2: {
    top: "75%"
  },
  gl3: {
    left: "25%",
    width: 0.5,
    height: "100%"
  },
  gl4: {
    left: "75%",
    width: 0.5,
    height: "100%"
  },
  buttonsWrap: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    height: 50
  },
  editButton: {
    position: "absolute",
    zIndex: 50,
    right: 10
  },
  saveButton: {
    backgroundColor: "rgba(0,0,0,1)",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignContent: "center",
    justifyContent: "center"
  },
  cancelButton: {
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingVertical: 4,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignContent: "center",
    justifyContent: "center"
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14
  },
  children: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent"
  }
});